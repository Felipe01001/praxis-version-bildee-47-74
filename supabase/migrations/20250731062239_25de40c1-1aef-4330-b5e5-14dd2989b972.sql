-- Corrigir a função schedule_task_notification para usar os nomes corretos dos campos
CREATE OR REPLACE FUNCTION public.schedule_task_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se a tarefa tem uma data de fim
  IF NEW."endDate" IS NOT NULL THEN
    -- Inserir notificação agendada diretamente na tabela
    INSERT INTO public.scheduled_notifications (
      task_id,
      user_id,
      scheduled_for,
      notification_type,
      message_content,
      status
    )
    VALUES (
      NEW.id,
      NEW."userId",
      NEW."endDate" - interval '1 day',
      'task_reminder',
      'Lembrete: A tarefa "' || NEW.title || '" vence amanhã.',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$function$