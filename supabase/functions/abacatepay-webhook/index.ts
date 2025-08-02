import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  devMode: boolean;
  data: {
    payment?: {
      amount: number;
      fee: number;
      method: string;
    };
    billing?: {
      id: string;
      status: string;
      amount: number;
      fee?: number;
      method?: string;
      customer?: {
        id: string;
        metadata: {
          name: string;
          email: string;
          taxId: string;
          cellphone?: string;
        };
      };
      frequency: string;
      kind: string[];
      paidAmount: number;
      products: Array<{
        externalId: string;
        id: string;
        quantity: number;
      }>;
    };
    pixQrCode?: {
      id: string;
      amount: number;
      kind: string;
      status: string;
    };
  };
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
    // Validate webhook secret
    const url = new URL(req.url);
    const webhookSecret = url.searchParams.get('webhookSecret');
    
    if (webhookSecret !== Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')) {
      console.error('Invalid webhook secret:', webhookSecret);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid webhook secret' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Received AbacatePay webhook:', JSON.stringify(payload, null, 2));

    // Validate that this is not a development event in production
    if (payload.devMode) {
      console.warn('Ignoring development webhook event in production');
      return new Response(
        JSON.stringify({ message: 'Development event ignored' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key
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

    const { event, data } = payload;

    if (event === 'billing.paid') {
      // Handle both billing types: direct billing and PIX QR Code
      let billingId: string;
      let amount: number;
      let customerInfo: any = null;
      
      if (data.billing && data.billing.status === 'PAID') {
        // Standard billing payment
        billingId = data.billing.id;
        amount = data.billing.amount;
        customerInfo = data.billing.customer?.metadata;
        console.log(`Processing billing payment - ID: ${billingId}, Amount: ${amount}`);
      } else if (data.pixQrCode && data.pixQrCode.status === 'PAID') {
        // PIX QR Code payment
        billingId = data.pixQrCode.id;
        amount = data.pixQrCode.amount;
        console.log(`Processing PIX QR Code payment - ID: ${billingId}, Amount: ${amount}`);
      } else {
        console.log(`Ignoring payment event - no valid PAID status found`);
        return new Response(
          JSON.stringify({ message: 'Event ignored - no PAID status' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log(`Processing payment confirmation for billing ID: ${billingId}`);
      
      // Find payment by billing ID (using efi_charge_id field for AbacatePay billing ID)
      const { data: payments, error: paymentsError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('efi_charge_id', billingId);

      if (paymentsError) {
        console.error('Error querying payments:', paymentsError);
        throw paymentsError;
      }

      if (payments && payments.length > 0) {
        const payment = payments[0];
        
        console.log(`Found payment for user ${payment.user_id}`);

        // Update payment status to confirmed
        const { error: updatePaymentError } = await supabase
          .from('pagamentos')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (updatePaymentError) {
          console.error('Error updating payment status:', updatePaymentError);
          throw updatePaymentError;
        }

        // Calculate next payment date (1 month from now)
        const nextPayment = new Date();
        nextPayment.setMonth(nextPayment.getMonth() + 1);

        // Activate subscription and approve user automatically
        const { error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({
            assinatura_ativa: true,
            aprovado_por_admin: true,
            data_aprovacao: new Date().toISOString(),
            proximo_pagamento: nextPayment.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', payment.user_id);

        if (updateProfileError) {
          console.error('Error updating user profile:', updateProfileError);
          throw updateProfileError;
        }

        // Log subscription event
        const { error: logEventError } = await supabase
          .from('subscription_events')
          .insert({
            user_id: payment.user_id,
            subscription_id: billingId,
            event_type: 'paid',
            event_data: data
          });

        if (logEventError) {
          console.error('Error logging subscription event:', logEventError);
          // Don't throw here, as the main operation succeeded
        }

        console.log(`AbacatePay payment confirmed and subscription activated for user ${payment.user_id}`);
      } else {
        console.warn(`No payment found for billing ID: ${billingId}`);
      }
    } else {
      console.log(`Ignoring webhook event: ${event} with status: ${data.billing?.status}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing AbacatePay webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});