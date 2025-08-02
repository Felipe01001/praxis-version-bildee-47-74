import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationRequest {
  user_id: string;
  user_email: string;
  action: 'approved' | 'rejected';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { user_id, user_email, action }: NotificationRequest = await req.json();

    console.log(`Sending ${action} notification to user ${user_id} (${user_email})`);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let emailSubject: string;
    let emailContent: string;

    if (action === 'approved') {
      emailSubject = "🎉 Sua conta foi aprovada!";
      emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #16a34a; text-align: center;">Parabéns! Sua conta foi aprovada</h1>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #15803d; font-size: 16px;">
              Sua conta no sistema Praxis foi aprovada pela nossa equipe administrativa.
            </p>
          </div>
          
          <p>Agora você pode acessar todas as funcionalidades do sistema:</p>
          
          <ul style="color: #374151; line-height: 1.6;">
            <li>Gerenciar seus clientes</li>
            <li>Criar e acompanhar casos</li>
            <li>Gerar petições automatizadas</li>
            <li>Consultar processos judiciais</li>
            <li>E muito mais!</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://app.praxis.com'}" 
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar o Sistema
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Se você tiver dúvidas, entre em contato com nossa equipe de suporte.
          </p>
        </div>
      `;
    } else {
      emailSubject = "Informações sobre sua conta";
      emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #dc2626; text-align: center;">Atualização sobre sua conta</h1>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #dc2626; font-size: 16px;">
              Infelizmente, não foi possível aprovar sua conta no momento.
            </p>
          </div>
          
          <p>Nossa equipe revisou sua solicitação, mas precisamos de algumas informações adicionais antes de prosseguir.</p>
          
          <p>Por favor, entre em contato conosco para esclarecer os próximos passos:</p>
          
          <ul style="color: #374151; line-height: 1.6;">
            <li>Verifique se todos os dados foram preenchidos corretamente</li>
            <li>Confirme se o pagamento foi processado</li>
            <li>Entre em contato com nossa equipe de suporte</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:suporte@praxis.com" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Entrar em Contato
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Agradecemos sua compreensão.
          </p>
        </div>
      `;
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Praxis <noreply@praxis.com>",
      to: [user_email],
      subject: emailSubject,
      html: emailContent,
    });

    console.log('Email sent successfully:', emailResponse);

    // Log notification in database
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        user_id,
        task_id: 'user_approval',
        notification_type: 'email',
        status: 'sent',
        message_content: emailSubject,
        delivery_method: 'email'
      });

    if (logError) {
      console.error('Error logging notification:', logError);
      // Don't throw here, as the main operation succeeded
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${action} notification sent successfully`,
        email_id: emailResponse.data?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send notification',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});