import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillingRequest {
  user_id: string;
  user_data: {
    name: string;
    email: string;
    cpf: string;
    cellphone?: string;
  };
  amount: number;
  description: string;
}

// Helper functions for formatting
function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return cpf;
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCellphone(cellphone: string): string {
  const cleanPhone = cellphone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cellphone;
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
    const { user_id, user_data, amount, description }: BillingRequest = await req.json();
    
    console.log('Creating AbacatePay billing for user:', user_id);
    console.log('User data received:', user_data);
    console.log('Amount:', amount);
    
    // Validate required data
    if (!user_data.email || !user_data.name || !user_data.cpf) {
      console.error('Missing required user data:', { email: !!user_data.email, name: !!user_data.name, cpf: !!user_data.cpf });
      throw new Error('Dados do usuário incompletos');
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

    // Get return URL base from environment
    const returnBase = Deno.env.get('RETURN_URL_BASE') || 'https://pocynpbouhtlkhcryopn.supabase.co';

    // Validate and format CPF and cellphone
    const cleanCPF = user_data.cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      throw new Error('CPF deve conter exatamente 11 dígitos');
    }

    // Ensure cellphone has valid format and apply mask
    let cleanCellphone = user_data.cellphone?.replace(/\D/g, '') || '';
    if (!cleanCellphone || (cleanCellphone.length !== 10 && cleanCellphone.length !== 11)) {
      cleanCellphone = '11999999999'; // Default valid cellphone
      console.log('Using default cellphone due to invalid/missing phone:', user_data.cellphone);
    }

    const formattedCPF = formatCPF(cleanCPF);
    const formattedCellphone = formatCellphone(cleanCellphone);

    console.log('Formatted data:', { cpf: formattedCPF, cellphone: formattedCellphone });

    // Prepare AbacatePay PIX QR Code data with correct structure
    const pixData = {
      amount: Math.round(amount * 100), // Convert to cents
      description: description,
      expiresIn: 3600, // 1 hour expiration
      customer: {
        name: user_data.name,
        email: user_data.email,
        taxId: formattedCPF,
        cellphone: formattedCellphone
      },
      metadata: {
        externalId: `praxis-monthly-${user_id}`
      }
    };

    console.log('Prepared PIX data:', JSON.stringify(pixData, null, 2));
    console.log('AbacatePay API Token available:', !!Deno.env.get('ABACATEPAY_API_TOKEN'));

    // Call AbacatePay PIX QR Code API
    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('ABACATEPAY_API_TOKEN')}`
      },
      body: JSON.stringify(pixData)
    });

    console.log('AbacatePay API response status:', abacatePayResponse.status);

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay API error details:', {
        status: abacatePayResponse.status,
        statusText: abacatePayResponse.statusText,
        headers: Object.fromEntries(abacatePayResponse.headers.entries()),
        body: errorText
      });
      throw new Error(`AbacatePay API error: ${abacatePayResponse.status} - ${errorText}`);
    }

    const abacatePayResult = await abacatePayResponse.json();
    console.log('AbacatePay billing created:', abacatePayResult.data.id);

    // Generate next payment date (1 month from now)
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    // Update user profile with subscription info
    const { error: updateProfileError } = await supabase
      .from('user_profiles')
      .update({
        assinatura_id: abacatePayResult.data.id,
        data_assinatura: new Date().toISOString(),
        proximo_pagamento: nextPayment.toISOString(),
        assinatura_ativa: false, // Will be activated when payment is confirmed
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateProfileError) {
      console.error('Error updating user profile:', updateProfileError);
      throw updateProfileError;
    }

    // Create payment record
    const { error: insertPaymentError } = await supabase
      .from('pagamentos')
      .insert({
        user_id: user_id,
        assinatura_id: abacatePayResult.data.id,
        efi_charge_id: abacatePayResult.data.id, // Using AbacatePay billing ID
        valor: amount,
        metodo_pagamento: 'pix',
        status: 'pending'
      });

    if (insertPaymentError) {
      console.error('Error creating payment record:', insertPaymentError);
      throw insertPaymentError;
    }

    console.log('Billing and payment records created successfully');

    // Extract QR code and PIX information from AbacatePay response
    const qrCodeBase64 = abacatePayResult.data.brCodeBase64 || null;
    const brCode = abacatePayResult.data.brCode || null;
    
    console.log('QR Code Base64 available:', !!qrCodeBase64);
    console.log('BR Code available:', !!brCode);
    console.log('PIX Charge ID:', abacatePayResult.data.id);

    return new Response(
      JSON.stringify({
        success: true,
        billing_id: abacatePayResult.data.id,
        redirect_url: `${returnBase}/payment-status?subscription_id=${abacatePayResult.data.id}&qr_code_base64=${encodeURIComponent(qrCodeBase64 || '')}&pix_code=${encodeURIComponent(brCode || '')}`,
        qr_code_base64: qrCodeBase64,
        pix_code: brCode,
        amount: abacatePayResult.data.amount,
        status: abacatePayResult.data.status,
        expires_at: abacatePayResult.data.expiresAt,
        message: 'PIX QR Code criado com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating AbacatePay billing:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Falha ao criar cobrança',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});