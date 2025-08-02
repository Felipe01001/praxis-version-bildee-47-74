-- Criar função para agendar notificações de tarefas
CREATE OR REPLACE FUNCTION public.schedule_task_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_record RECORD;
BEGIN
  -- Remover notificações antigas se a tarefa for atualizada
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM public.scheduled_notifications WHERE task_id = NEW.id;
  END IF;
  
  -- Verificar se a tarefa tem data de fim
  IF NEW."endDate" IS NOT NULL THEN
    -- Buscar configurações de notificação do usuário para esta tarefa
    FOR notification_record IN 
      SELECT * FROM public.notification_settings 
      WHERE user_id = NEW."userId" AND (task_id = NEW.id::text OR task_id = 'default')
      ORDER BY CASE WHEN task_id = NEW.id::text THEN 0 ELSE 1 END
    LOOP
      -- Inserir notificação agendada
      INSERT INTO public.scheduled_notifications (
        task_id,
        user_id,
        scheduled_for,
        notification_type,
        message_content,
        status,
        channels
      )
      VALUES (
        NEW.id,
        NEW."userId",
        NEW."endDate" - interval '1 day' * notification_record.days_before,
        'task_reminder',
        'Lembrete: A tarefa "' || NEW.title || '" vence em ' || notification_record.days_before || ' dia(s).',
        'pending',
        CASE 
          WHEN notification_record.email_enabled AND notification_record.whatsapp_enabled THEN ARRAY['email', 'whatsapp']
          WHEN notification_record.email_enabled THEN ARRAY['email']
          WHEN notification_record.whatsapp_enabled THEN ARRAY['whatsapp']
          ELSE ARRAY['email']
        END
      );
      
      -- Se for configuração específica da tarefa, sair do loop
      IF notification_record.task_id = NEW.id::text THEN
        EXIT;
      END IF;
    END LOOP;
    
    -- Se não houver configurações específicas, usar configuração padrão
    IF NOT EXISTS (
      SELECT 1 FROM public.notification_settings 
      WHERE user_id = NEW."userId" AND (task_id = NEW.id::text OR task_id = 'default')
    ) THEN
      -- Inserir notificação padrão (1 dia antes)
      INSERT INTO public.scheduled_notifications (
        task_id,
        user_id,
        scheduled_for,
        notification_type,
        message_content,
        status,
        channels
      )
      VALUES (
        NEW.id,
        NEW."userId",
        NEW."endDate" - interval '1 day',
        'task_reminder',
        'Lembrete: A tarefa "' || NEW.title || '" vence amanhã.',
        'pending',
        ARRAY['email']
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS schedule_task_notification_trigger ON public.tasks;

-- Criar novo trigger
CREATE TRIGGER schedule_task_notification_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_task_notifications();

-- Criar função para processar notificações pendentes
CREATE OR REPLACE FUNCTION public.process_pending_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_record RECORD;
  task_record RECORD;
  client_record RECORD;
  user_record RECORD;
BEGIN
  -- Buscar notificações pendentes que devem ser enviadas agora
  FOR notification_record IN 
    SELECT * FROM public.scheduled_notifications 
    WHERE status = 'pending' 
    AND scheduled_for <= NOW()
    LIMIT 50 -- Processar em lotes para evitar sobrecarga
  LOOP
    BEGIN
      -- Buscar dados da tarefa
      SELECT * INTO task_record FROM public.tasks WHERE id = notification_record.task_id;
      
      IF task_record IS NOT NULL THEN
        -- Buscar dados do cliente
        SELECT * INTO client_record FROM public.clients WHERE id = task_record."clientId";
        
        -- Buscar dados do usuário
        SELECT * INTO user_record FROM public.user_profiles WHERE user_id = notification_record.user_id;
        
        -- Chamar edge function para envio do email
        PERFORM net.http_post(
          url := 'https://pocynpbouhtlkhcryopn.supabase.co/functions/v1/send-task-notification',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
          body := json_build_object(
            'notification_id', notification_record.id,
            'user_id', notification_record.user_id,
            'task', json_build_object(
              'id', task_record.id,
              'title', task_record.title,
              'description', task_record.description,
              'endDate', task_record."endDate",
              'status', task_record.status
            ),
            'client', json_build_object(
              'name', client_record.name,
              'email', client_record.email
            ),
            'user_profile', json_build_object(
              'phone', user_record.phone,
              'state', user_record.state,
              'city', user_record.city
            ),
            'channels', notification_record.channels,
            'message_content', notification_record.message_content
          )::jsonb
        );
        
        -- Atualizar status da notificação para processando
        UPDATE public.scheduled_notifications 
        SET status = 'processing', updated_at = NOW()
        WHERE id = notification_record.id;
        
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log do erro e marcar notificação como falhada
      UPDATE public.scheduled_notifications 
      SET status = 'failed', updated_at = NOW()
      WHERE id = notification_record.id;
      
      -- Inserir log de erro
      INSERT INTO public.notification_logs (
        user_id, 
        task_id, 
        notification_type, 
        status, 
        error_message,
        message_content
      )
      VALUES (
        notification_record.user_id,
        notification_record.task_id::text,
        notification_record.notification_type,
        'failed',
        SQLERRM,
        notification_record.message_content
      );
    END;
  END LOOP;
END;
$function$;

-- Habilitar extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;