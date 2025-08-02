import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  Clock, 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingUser {
  user_id: string;
  phone: string;
  state: string;
  city: string;
  assinatura_ativa: boolean;
  aprovado_por_admin: boolean;
  role: string;
  created_at: string;
  proximo_pagamento: string | null;
  user_email?: string;
}

interface AdminStats {
  totalUsers: number;
  pendingApproval: number;
  activeSubscriptions: number;
  adminUsers: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingApproval: 0,
    activeSubscriptions: 0,
    adminUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
        loadAdminData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load pending users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('aprovado_por_admin', false)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get email addresses from auth.users (we'll need to use a different approach)
      const usersWithEmails = await Promise.all(
        (users || []).map(async (userProfile) => {
          try {
            // Note: In a real implementation, you'd need to fetch emails via a secure function
            // For now, we'll use the user_id as placeholder
            return {
              ...userProfile,
              user_email: `user-${userProfile.user_id.slice(0, 8)}@example.com`
            };
          } catch {
            return { ...userProfile, user_email: 'Não disponível' };
          }
        })
      );

      setPendingUsers(usersWithEmails);

      // Load stats
      const { data: allUsers, error: statsError } = await supabase
        .from('user_profiles')
        .select('role, assinatura_ativa, aprovado_por_admin');

      if (statsError) throw statsError;

      const stats = (allUsers || []).reduce(
        (acc, user) => {
          acc.totalUsers++;
          if (user.role === 'admin') acc.adminUsers++;
          if (!user.aprovado_por_admin) acc.pendingApproval++;
          if (user.assinatura_ativa) acc.activeSubscriptions++;
          return acc;
        },
        { totalUsers: 0, pendingApproval: 0, activeSubscriptions: 0, adminUsers: 0 }
      );

      setStats(stats);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const userToApprove = pendingUsers.find(u => u.user_id === userId);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          aprovado_por_admin: true,
          data_aprovacao: new Date().toISOString(),
          aprovado_por_user_id: user?.id
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: user?.id,
        p_target_user_id: userId,
        p_action: 'approve_user',
        p_details: { timestamp: new Date().toISOString() }
      });

      // Send approval notification
      if (userToApprove?.user_email) {
        try {
          await supabase.functions.invoke('notify-user-approval', {
            body: {
              user_id: userId,
              user_email: userToApprove.user_email,
              action: 'approved'
            }
          });
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Don't fail the approval if notification fails
        }
      }

      toast.success('Usuário aprovado com sucesso!');
      loadAdminData(); // Reload data
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erro ao aprovar usuário');
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      // For now, we'll just mark as not approved and potentially deactivate
      const { error } = await supabase
        .from('user_profiles')
        .update({
          assinatura_ativa: false,
          aprovado_por_admin: false
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_admin_action', {
        p_admin_user_id: user?.id,
        p_target_user_id: userId,
        p_action: 'reject_user',
        p_details: { timestamp: new Date().toISOString() }
      });

      toast.success('Usuário rejeitado');
      loadAdminData(); // Reload data
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Erro ao rejeitar usuário');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.adminUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Usuários Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Usuários Aprovados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário pendente de aprovação</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingUsers.map((pendingUser) => (
                <Card key={pendingUser.user_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {pendingUser.user_email}
                        </CardTitle>
                        <CardDescription>
                          {pendingUser.city}, {pendingUser.state}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={pendingUser.assinatura_ativa ? "default" : "destructive"}>
                          {pendingUser.assinatura_ativa ? "Pago" : "Não Pago"}
                        </Badge>
                        <Badge variant="secondary">
                          {pendingUser.role}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Telefone: {pendingUser.phone || 'Não informado'}</p>
                        <p>Cadastrado: {new Date(pendingUser.created_at).toLocaleDateString('pt-BR')}</p>
                        {pendingUser.proximo_pagamento && (
                          <p>Próximo pagamento: {new Date(pendingUser.proximo_pagamento).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectUser(pendingUser.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveUser(pendingUser.user_id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Lista de usuários aprovados em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;