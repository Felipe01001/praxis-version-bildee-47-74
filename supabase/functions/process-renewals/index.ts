import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  user_id: string;
  assinatura_ativa: boolean;
  proximo_pagamento: string;
  assinatura_id: string;
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
    console.log('Starting renewal process...');

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

    // Find users with active subscriptions that are due for renewal
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, assinatura_ativa, proximo_pagamento, assinatura_id')
      .eq('assinatura_ativa', true)
      .lte('proximo_pagamento', new Date().toISOString());

    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} subscriptions due for renewal`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No subscriptions due for renewal',
          processed: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const profile of profiles as UserProfile[]) {
      try {
        console.log(`Processing renewal for user ${profile.user_id}`);

        // Get user data for creating new billing
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
        
        if (authError || !authUser.user) {
          console.error(`Failed to get user data for ${profile.user_id}:`, authError);
          errors.push(`User ${profile.user_id}: Failed to get user data`);
          continue;
        }

        // Prepare billing data for AbacatePay
        const billingData = {
          frequency: 'ONE_TIME',
          methods: ['PIX'],
          products: [{
            externalId: 'praxis_sub_mensal',
            name: 'Assinatura Mensal PRAXIS - Renovação',
            description: 'Renovação de acesso completo por um mês',
            quantity: 1,
            price: 990 // preço em centavos (R$ 9,90)
          }],
          returnUrl: `${Deno.env.get('RETURN_URL_BASE') || 'https://your-domain.com'}/payment-status?subscription_id={id}`,
          completionUrl: `${Deno.env.get('RETURN_URL_BASE') || 'https://your-domain.com'}/dashboard`,
          customer: {
            name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Cliente',
            email: authUser.user.email!,
            taxId: authUser.user.user_metadata?.cpf
          },
          allowCoupons: false
        };

        // Create AbacatePay billing
        const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_TOKEN')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(billingData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AbacatePay API error for user ${profile.user_id}:`, errorText);
          errors.push(`User ${profile.user_id}: AbacatePay API error - ${response.status}`);
          continue;
        }

        const billingResult = await response.json();
        const billingId = billingResult.data.id;
        const paymentUrl = billingResult.data.url;

        // Deactivate current subscription until payment is confirmed
        const { error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({
            assinatura_ativa: false,
            assinatura_id: billingId,
            data_assinatura: new Date().toISOString(),
            proximo_pagamento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profile.user_id);

        if (updateProfileError) {
          console.error(`Error updating profile for user ${profile.user_id}:`, updateProfileError);
          errors.push(`User ${profile.user_id}: Failed to update profile`);
          continue;
        }

        // Record new payment
        const { error: insertPaymentError } = await supabase
          .from('pagamentos')
          .insert({
            user_id: profile.user_id,
            assinatura_id: billingId,
            valor: 9.90,
            metodo_pagamento: 'abacatepay_pix',
            status: 'pending',
            efi_charge_id: billingId
          });

        if (insertPaymentError) {
          console.error(`Error recording payment for user ${profile.user_id}:`, insertPaymentError);
          errors.push(`User ${profile.user_id}: Failed to record payment`);
          continue;
        }

        // Log subscription event
        const { error: logEventError } = await supabase
          .from('subscription_events')
          .insert({
            user_id: profile.user_id,
            subscription_id: billingId,
            event_type: 'renewal_created',
            event_data: {
              payment_method: 'abacatepay_pix',
              abacatepay_response: billingResult.data,
              payment_url: paymentUrl,
              previous_subscription_id: profile.assinatura_id,
              auto_renewal: true
            }
          });

        if (logEventError) {
          console.error(`Error logging event for user ${profile.user_id}:`, logEventError);
          // Don't count this as a failure since the main operation succeeded
        }

        // TODO: Send notification to user about new payment
        // This could be done via email or in-app notification
        console.log(`Renewal processed successfully for user ${profile.user_id}, billing ID: ${billingId}`);
        processedCount++;

      } catch (error) {
        console.error(`Error processing renewal for user ${profile.user_id}:`, error);
        errors.push(`User ${profile.user_id}: ${error.message}`);
      }
    }

    console.log(`Renewal process completed. Processed: ${processedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processedCount,
        total: profiles.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in renewal process:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Renewal process failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});