-- Recriar o trigger para usar a função corrigida
DROP TRIGGER IF EXISTS schedule_task_notification_trigger ON public.tasks;

CREATE TRIGGER schedule_task_notification_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_task_notification();