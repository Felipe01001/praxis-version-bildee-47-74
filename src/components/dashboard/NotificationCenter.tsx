import { useState, useEffect } from 'react';
import { Bell, Settings, Clock, CheckCircle, AlertTriangle, X, Save, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  task_id: string;
  scheduled_for: string;
  notification_type: string;
  message_content: string;
  status: string;
  channels: string[];
  created_at: string;
  updated_at: string;
}

interface NotificationLog {
  id: string;
  user_id: string;
  task_id: string;
  notification_type: string;
  status: string;
  sent_at: string;
  delivery_method: string;
  message_content: string;
  error_message?: string;
}

interface NotificationSetting {
  id: string;
  user_id: string;
  task_id: string;
  days_before: number;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number?: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  endDate: string;
  status: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [defaultSettings, setDefaultSettings] = useState<NotificationSetting | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estados para configurações padrão
  const [newDaysBefore, setNewDaysBefore] = useState(1);
  const [newEmailEnabled, setNewEmailEnabled] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar notificações agendadas
      const { data: scheduledNotifications } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (scheduledNotifications) {
        setNotifications(scheduledNotifications);
        
        // Contar notificações não enviadas que devem ser enviadas em breve
        const pendingCount = scheduledNotifications.filter(n => 
          n.status === 'pending' && 
          new Date(n.scheduled_for) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // próximos 7 dias
        ).length;
        setUnreadCount(pendingCount);
      }

      // Buscar logs de notificações
      const { data: logs } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (logs) {
        setNotificationLogs(logs);
      }

      // Buscar configurações de notificação
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationSettings) {
        const defaultSetting = notificationSettings.find(s => s.task_id === 'default');
        const taskSpecificSettings = notificationSettings.filter(s => s.task_id !== 'default');
        
        setDefaultSettings(defaultSetting || null);
        setSettings(taskSpecificSettings);
        
        // Inicializar valores do formulário
        if (defaultSetting) {
          setNewDaysBefore(defaultSetting.days_before);
          setNewEmailEnabled(defaultSetting.email_enabled);
        }
      }

      // Buscar tarefas próximas do vencimento
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, endDate, status')
        .eq('userId', user.id)
        .not('status', 'eq', 'completed')
        .gte('endDate', new Date().toISOString())
        .lte('endDate', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()) // próximas 2 semanas
        .order('endDate', { ascending: true });

      if (tasks) {
        setUpcomingTasks(tasks);
      }

    } catch (error) {
      console.error('Erro ao buscar dados de notificação:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const saveDefaultSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const settingsData = {
        user_id: user.id,
        task_id: 'default',
        days_before: newDaysBefore,
        email_enabled: newEmailEnabled,
        whatsapp_enabled: false,
        whatsapp_number: null,
      };

      if (defaultSettings) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('notification_settings')
          .update(settingsData)
          .eq('id', defaultSettings.id);

        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('notification_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
      fetchData();

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviada';
      case 'failed':
        return 'Falhou';
      case 'pending':
        return 'Agendada';
      default:
        return status;
    }
  };

  const getDaysUntilDue = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    if (days > 0) return `Vence em ${days} dias`;
    return `Venceu há ${Math.abs(days)} dias`;
  };

  const getUrgencyColor = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'destructive';
    if (days <= 1) return 'destructive';
    if (days <= 3) return 'default';
    return 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">
              Próximas Tarefas
              {upcomingTasks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Notificações Agendadas
              {notifications.filter(n => n.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => n.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <TabsContent value="upcoming" className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Prazo: {formatDate(task.endDate)}
                        </p>
                      </div>
                      <Badge variant={getUrgencyColor(task.endDate)}>
                        {getDaysUntilDue(task.endDate)}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa próxima do vencimento</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Configurações de Notificação</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dias antes do vencimento</Label>
                    <Select
                      value={newDaysBefore.toString()}
                      onValueChange={(value) => setNewDaysBefore(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No dia do vencimento</SelectItem>
                        <SelectItem value="1">1 dia antes</SelectItem>
                        <SelectItem value="2">2 dias antes</SelectItem>
                        <SelectItem value="3">3 dias antes</SelectItem>
                        <SelectItem value="7">1 semana antes</SelectItem>
                        <SelectItem value="14">2 semanas antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Canais de Notificação</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <Label>Email</Label>
                    </div>
                    <Switch
                      checked={newEmailEnabled}
                      onCheckedChange={setNewEmailEnabled}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={saveDefaultSettings} disabled={saving} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Card key={notification.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(notification.status)}
                          <Badge variant="outline">
                            {getStatusLabel(notification.status)}
                          </Badge>
                          <Badge variant="secondary">
                            {notification.channels.join(', ')}
                          </Badge>
                        </div>
                        <p className="text-sm">{notification.message_content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agendada para: {formatDate(notification.scheduled_for)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação agendada</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : notificationLogs.length > 0 ? (
                notificationLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(log.status)}
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                            {getStatusLabel(log.status)}
                          </Badge>
                          <Badge variant="secondary">
                            {log.delivery_method}
                          </Badge>
                        </div>
                        <p className="text-sm">{log.message_content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(log.sent_at)}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            Erro: {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação enviada ainda</p>
                </div>
              )}
            </TabsContent>
          </div>

          <div className="flex justify-center pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              Atualizar
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}