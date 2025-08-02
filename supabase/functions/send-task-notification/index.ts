import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskNotificationRequest {
  notification_id: string;
  user_id: string;
  task: {
    id: string;
    title: string;
    description?: string;
    endDate: string;
    status: string;
  };
  client: {
    name: string;
    email?: string;
  };
  user_profile: {
    phone?: string;
    state?: string;
    city?: string;
  };
  channels: string[];
  message_content: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      notification_id,
      user_id,
      task,
      client,
      user_profile,
      channels,
      message_content
    }: TaskNotificationRequest = await req.json();

    console.log('Processing notification:', notification_id);

    // Buscar dados do usuário autenticado para obter o email
    const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
    
    if (!authUser?.user?.email) {
      throw new Error('Email do usuário não encontrado');
    }

    const userEmail = authUser.user.email;
    const userName = authUser.user.user_metadata?.name || 'Usuário';

    // Formatar data de vencimento
    const endDate = new Date(task.endDate);
    const formattedDate = endDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = endDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calcular dias restantes
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgencyLevel = 'normal';
    let urgencyText = '';
    
    if (daysRemaining <= 0) {
      urgencyLevel = 'critical';
      urgencyText = 'VENCE HOJE!';
    } else if (daysRemaining === 1) {
      urgencyLevel = 'urgent';
      urgencyText = 'Vence amanhã';
    } else if (daysRemaining <= 3) {
      urgencyLevel = 'warning';
      urgencyText = `Vence em ${daysRemaining} dias`;
    } else {
      urgencyText = `Vence em ${daysRemaining} dias`;
    }

    // Template de email profissional
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete de Tarefa - Praxis</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .urgency-banner { padding: 12px; text-align: center; font-weight: bold; font-size: 16px; }
          .critical { background-color: #dc2626; color: white; }
          .urgent { background-color: #ea580c; color: white; }
          .warning { background-color: #d97706; color: white; }
          .normal { background-color: #059669; color: white; }
          .content { padding: 30px; }
          .task-card { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .task-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
          .task-details { color: #6b7280; line-height: 1.6; }
          .client-info { background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .date-info { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚖️ Praxis</div>
            <h1>Lembrete de Tarefa</h1>
          </div>
          
          <div class="urgency-banner ${urgencyLevel}">
            🔔 ${urgencyText}
          </div>
          
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            
            <p>Este é um lembrete automático sobre uma tarefa que requer sua atenção:</p>
            
            <div class="task-card">
              <div class="task-title">📋 ${task.title}</div>
              <div class="task-details">
                ${task.description ? `<p><strong>Descrição:</strong> ${task.description}</p>` : ''}
                <p><strong>Status:</strong> ${task.status === 'pending' ? 'Pendente' : task.status === 'in-progress' ? 'Em andamento' : task.status === 'completed' ? 'Concluída' : task.status}</p>
              </div>
            </div>
            
            <div class="client-info">
              <h3>👤 Cliente</h3>
              <p><strong>${client.name}</strong></p>
              ${client.email ? `<p>📧 ${client.email}</p>` : ''}
            </div>
            
            <div class="date-info">
              <h3>📅 Prazo de Entrega</h3>
              <p><strong>${formattedDate}</strong> às <strong>${formattedTime}</strong></p>
              <p style="color: #92400e; font-weight: 600;">${urgencyText}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://praxiis.xyz/tasks" class="btn">
                📊 Visualizar no Sistema
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              💡 <strong>Dica:</strong> Mantenha seus clientes informados sobre o progresso das tarefas para garantir um excelente atendimento.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Praxis - Sistema de Gestão Jurídica</strong></p>
            <p>Este é um email automático. Para alterar suas preferências de notificação, acesse o sistema.</p>
            <p style="margin-top: 15px;">
              📧 <a href="mailto:suporte@praxiis.xyz" style="color: #3b82f6;">suporte@praxiis.xyz</a> | 
              🌐 <a href="https://praxiis.xyz" style="color: #3b82f6;">praxiis.xyz</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email se o canal de email estiver habilitado
    if (channels.includes('email')) {
      const emailResponse = await resend.emails.send({
        from: 'Praxis <noreply@praxiis.xyz>',
        to: [userEmail],
        subject: `🔔 ${urgencyText} - ${task.title}`,
        html: emailHtml,
      });

      console.log('Email enviado:', emailResponse);

      if (emailResponse.error) {
        throw new Error(`Erro ao enviar email: ${emailResponse.error.message}`);
      }
    }

    // Registrar log de notificação bem-sucedida
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        user_id,
        task_id: task.id,
        notification_type: 'task_reminder',
        status: 'sent',
        delivery_method: channels.join(','),
        message_content: message_content,
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    // Atualizar status da notificação para enviada
    const { error: updateError } = await supabase
      .from('scheduled_notifications')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', notification_id);

    if (updateError) {
      console.error('Erro ao atualizar notificação:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação enviada com sucesso',
        notification_id,
        channels_sent: channels
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro na função send-task-notification:', error);
    
    // Registrar erro no log
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const requestData = await req.json().catch(() => ({}));
      
      await supabase
        .from('notification_logs')
        .insert({
          user_id: requestData.user_id || '',
          task_id: requestData.task?.id || '',
          notification_type: 'task_reminder',
          status: 'failed',
          error_message: error.message,
          message_content: requestData.message_content || '',
        });
    } catch (logError) {
      console.error('Erro ao registrar log de erro:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);