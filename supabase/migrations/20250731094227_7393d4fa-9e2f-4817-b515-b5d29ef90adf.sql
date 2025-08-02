-- Fix remaining function search path warning
CREATE OR REPLACE FUNCTION public.process_pending_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;