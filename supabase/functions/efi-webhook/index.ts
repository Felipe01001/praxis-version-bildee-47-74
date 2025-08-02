import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EFI-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookData = await req.json();
    logStep("Webhook data received", webhookData);

    // Handle EFI PIX webhook format
    if (webhookData.pix && Array.isArray(webhookData.pix)) {
      await handleEfiPixWebhook(supabaseClient, webhookData);
    } else {
      // Legacy webhook format
      const { type, data } = webhookData;

      switch (type) {
        case 'subscription.activated':
        case 'payment.confirmed':
          await handleSubscriptionActivated(supabaseClient, data);
          break;
          
        case 'subscription.canceled':
        case 'subscription.suspended':
        case 'payment.failed':
          await handleSubscriptionDeactivated(supabaseClient, data);
          break;
          
        default:
          logStep("Unhandled webhook type", { type });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in efi-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionActivated(supabaseClient: any, data: any) {
  logStep("Handling subscription activation", data);
  
  const { subscription_id, customer_email, txid, charge_id } = data;
  let finalSubscriptionId = subscription_id;
  
  // Handle different payment types
  if (txid) {
    finalSubscriptionId = `pix_${txid}`;
  } else if (charge_id) {
    finalSubscriptionId = `boleto_${charge_id}`;
  }
  
  // Find user by email or subscription_id
  let user = null;
  
  if (customer_email) {
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.listUsers();
    if (!authError && authUser?.users) {
      user = authUser.users.find((u: any) => u.email === customer_email);
    }
  }
  
  // If not found by email, try to find by subscription_id in user_profiles
  if (!user && finalSubscriptionId) {
    const { data: profileData, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_id')
      .eq('assinatura_id', finalSubscriptionId)
      .single();
      
    if (!profileError && profileData) {
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUser(profileData.user_id);
      if (!authError && authUser?.user) {
        user = authUser.user;
      }
    }
  }
  
  if (!user) {
    logStep("User not found", { customer_email, finalSubscriptionId });
    return;
  }

  // Update subscription status with validated payment
  const proximoPagamento = new Date();
  proximoPagamento.setMonth(proximoPagamento.getMonth() + 1);

  const { error: updateError } = await supabaseClient
    .from('user_profiles')
    .update({
      assinatura_ativa: true,
      data_assinatura: new Date().toISOString(),
      proximo_pagamento: proximoPagamento.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateError) {
    logStep("Error updating subscription status", updateError);
    return;
  }

  // Update payment status to confirmed
  await supabaseClient
    .from('pagamentos')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('assinatura_id', finalSubscriptionId);

  // Log subscription event
  await supabaseClient
    .from('subscription_events')
    .insert({
      user_id: user.id,
      subscription_id: finalSubscriptionId,
      event_type: 'activated',
      event_data: {
        payment_method: data.payment_method || 'unknown',
        webhook_data: data
      }
    });

  logStep("Subscription activated successfully", { userId: user.id, subscription_id: finalSubscriptionId });
}

async function handleSubscriptionDeactivated(supabaseClient: any, data: any) {
  logStep("Handling subscription deactivation", data);
  
  const { subscription_id, customer_email } = data;
  
  // Find user by email
  const { data: authUser, error: authError } = await supabaseClient.auth.admin.listUsers();
  if (authError) {
    logStep("Error fetching users", authError);
    return;
  }
  
  const user = authUser.users.find((u: any) => u.email === customer_email);
  if (!user) {
    logStep("User not found", { customer_email });
    return;
  }

  // Deactivate subscription
  const { error: updateError } = await supabaseClient
    .from('user_profiles')
    .update({
      assinatura_ativa: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateError) {
    logStep("Error deactivating subscription", updateError);
    return;
  }

  // Record payment failure/cancellation
  await supabaseClient
    .from('pagamentos')
    .insert({
      user_id: user.id,
      assinatura_id: subscription_id,
      valor: 9.90,
      metodo_pagamento: data.payment_method || 'unknown',
      status: 'failed',
      efi_charge_id: data.charge_id
    });

  logStep("Subscription deactivated successfully", { userId: user.id, subscription_id });
}

async function handleEfiPixWebhook(supabaseClient: any, webhookData: any) {
  logStep("Handling EFI PIX webhook", webhookData);
  
  const { pix } = webhookData;
  
  if (!Array.isArray(pix)) {
    logStep("Invalid PIX webhook format - no pix array");
    return;
  }

  // Process each PIX transaction
  for (const pixTransaction of pix) {
    const { txid, valor, status } = pixTransaction;
    
    logStep("Processing PIX transaction", { txid, valor, status });
    
    if (status === 'CONCLUIDA') {
      // Find payment by EFI charge ID
      const { data: payment, error: paymentError } = await supabaseClient
        .from('pagamentos')
        .select('*')
        .eq('efi_charge_id', txid)
        .single();
        
      if (paymentError || !payment) {
        logStep("Payment not found for txid", { txid, error: paymentError });
        continue;
      }
      
      logStep("Found payment", { paymentId: payment.id, userId: payment.user_id });
      
      // Update payment status
      const { error: updatePaymentError } = await supabaseClient
        .from('pagamentos')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
        
      if (updatePaymentError) {
        logStep("Error updating payment", updatePaymentError);
        continue;
      }
      
      // Calculate next payment date (30 days from now)
      const proximoPagamento = new Date();
      proximoPagamento.setMonth(proximoPagamento.getMonth() + 1);
      
      // Activate subscription
      const { error: activateError } = await supabaseClient
        .from('user_profiles')
        .update({
          assinatura_ativa: true,
          data_assinatura: new Date().toISOString(),
          proximo_pagamento: proximoPagamento.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', payment.user_id)
        .eq('assinatura_id', payment.assinatura_id);
        
      if (activateError) {
        logStep("Error activating subscription", activateError);
        continue;
      }
      
      // Log subscription event
      await supabaseClient
        .from('subscription_events')
        .insert({
          user_id: payment.user_id,
          subscription_id: payment.assinatura_id,
          event_type: 'activated',
          event_data: {
            txid,
            valor,
            activated_via: 'efi_pix_webhook',
            payment_method: 'pix'
          }
        });
        
      logStep("PIX payment processed and subscription activated", { 
        userId: payment.user_id, 
        subscriptionId: payment.assinatura_id,
        txid 
      });
    }
  }
}