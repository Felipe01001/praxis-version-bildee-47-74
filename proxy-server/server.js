require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const winston = require('winston');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'efi-proxy' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// Environment validation
const requiredEnvVars = [
  'EFI_CLIENT_ID',
  'EFI_CLIENT_SECRET',
  'EFI_PIX_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ABACATEPAY_API_TOKEN',
  'ABACATEPAY_WEBHOOK_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// EFI API configuration
const EFI_SANDBOX = process.env.EFI_SANDBOX === 'true';
const EFI_BASE_URL = EFI_SANDBOX 
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br';

// Create HTTPS agent with certificate for production
let httpsAgent;
if (!EFI_SANDBOX && process.env.EFI_CERTIFICATE_PATH) {
  try {
    const cert = fs.readFileSync(process.env.EFI_CERTIFICATE_PATH);
    const key = fs.readFileSync(process.env.EFI_KEY_PATH);
    
    httpsAgent = new https.Agent({
      cert: cert,
      key: key,
      ca: fs.readFileSync(process.env.EFI_CA_PATH || process.env.EFI_CERTIFICATE_PATH),
      rejectUnauthorized: true
    });
    
    logger.info('mTLS certificate loaded successfully');
  } catch (error) {
    logger.error('Failed to load mTLS certificate:', error);
    if (!EFI_SANDBOX) {
      process.exit(1);
    }
  }
}

// EFI Token cache
let efiTokenCache = {
  token: null,
  expiresAt: null
};

// Get EFI OAuth token with retry logic
async function getEfiToken(retries = 3) {
  // Check cache first
  if (efiTokenCache.token && efiTokenCache.expiresAt > Date.now()) {
    return efiTokenCache.token;
  }

  const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64');
  
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };

  if (EFI_SANDBOX) {
    headers['x-skip-mtls-checking'] = 'true';
  }

  const config = {
    method: 'POST',
    url: `${EFI_BASE_URL}/oauth/token`,
    headers,
    data: { grant_type: 'client_credentials' },
    timeout: 30000
  };

  if (httpsAgent) {
    config.httpsAgent = httpsAgent;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`Attempting to get EFI token (attempt ${attempt}/${retries})`);
      
      const response = await axios(config);
      
      if (response.data.access_token) {
        // Cache token (assuming 1 hour expiry)
        efiTokenCache = {
          token: response.data.access_token,
          expiresAt: Date.now() + (3600 * 1000) // 1 hour
        };
        
        logger.info('EFI token obtained successfully');
        return response.data.access_token;
      }
    } catch (error) {
      logger.error(`EFI token attempt ${attempt} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (attempt === retries) {
        throw new Error(`Failed to obtain EFI token after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Create PIX charge
async function createPixCharge(token, chargeData) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (EFI_SANDBOX) {
    headers['x-skip-mtls-checking'] = 'true';
  }

  const config = {
    method: 'POST',
    url: `${EFI_BASE_URL}/v2/cob`,
    headers,
    data: chargeData,
    timeout: 30000
  };

  if (httpsAgent) {
    config.httpsAgent = httpsAgent;
  }

  const response = await axios(config);
  return response.data;
}

// Update Supabase
async function updateSupabase(endpoint, data, method = 'POST') {
  const config = {
    method,
    url: `${process.env.SUPABASE_URL}/rest/v1/${endpoint}`,
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    data
  };

  const response = await axios(config);
  return response.data;
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: EFI_SANDBOX ? 'sandbox' : 'production'
  });
});

// Create PIX charge
app.post('/create-pix', async (req, res) => {
  try {
    const { user_id, user_data, subscription_id } = req.body;

    if (!user_id || !user_data) {
      return res.status(400).json({ error: 'Missing required fields: user_id, user_data' });
    }

    logger.info('Creating PIX charge', { user_id, subscription_id });

    // Get EFI token
    const token = await getEfiToken();

    // Prepare charge data
    const chargeData = {
      calendario: {
        expiracao: 3600 // 1 hour
      },
      devedor: {
        cpf: user_data.cpf || '11144477735',
        nome: user_data.full_name || user_data.email?.split('@')[0] || 'Cliente'
      },
      valor: {
        original: '9.90'
      },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: 'Assinatura PRAXIS - Sistema para Advogados'
    };

    // Create PIX charge
    const efiResponse = await createPixCharge(token, chargeData);
    
    const finalSubscriptionId = subscription_id || `pix_${efiResponse.txid || Date.now()}`;
    const paymentUrl = efiResponse.loc?.location || efiResponse.location || null;

    // Log subscription event
    await updateSupabase('subscription_events', {
      user_id,
      subscription_id: finalSubscriptionId,
      event_type: 'created',
      event_data: {
        payment_method: 'pix',
        efi_response: efiResponse,
        payment_url: paymentUrl,
        proxy_processed: true
      }
    });

    // Update user profile
    await updateSupabase('user_profiles?user_id=eq.' + user_id, {
      assinatura_ativa: false,
      assinatura_id: finalSubscriptionId,
      data_assinatura: new Date().toISOString(),
      proximo_pagamento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, 'PATCH');

    // Record payment
    await updateSupabase('pagamentos', {
      user_id,
      assinatura_id: finalSubscriptionId,
      valor: 9.90,
      metodo_pagamento: 'pix',
      status: 'pending',
      efi_charge_id: efiResponse.txid || null
    });

    logger.info('PIX charge created successfully', { 
      subscription_id: finalSubscriptionId,
      txid: efiResponse.txid 
    });

    res.json({
      success: true,
      redirect_url: paymentUrl,
      subscription_id: finalSubscriptionId,
      payment_method: 'pix',
      qr_code: efiResponse.pixCopiaECola || efiResponse.qrcode || null,
      txid: efiResponse.txid
    });

  } catch (error) {
    logger.error('Error creating PIX charge:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      error: 'Failed to create PIX charge',
      message: error.message,
      code: error.response?.status || 'INTERNAL_ERROR'
    });
  }
});

// Create AbacatePay billing
app.post('/create-abacatepay-billing', async (req, res) => {
  try {
    const { user_id, user_data } = req.body;

    if (!user_id || !user_data) {
      return res.status(400).json({ error: 'Missing required fields: user_id, user_data' });
    }

    logger.info('Creating AbacatePay billing', { user_id });

    // Prepare billing data
    const billingData = {
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      products: [{
        externalId: 'praxis_sub_mensal',
        name: 'Assinatura Mensal PRAXIS',
        description: 'Acesso completo por um mês',
        quantity: 1,
        price: 990 // preço em centavos (R$ 9,90)
      }],
      returnUrl: `${process.env.RETURN_URL_BASE || 'http://localhost:5173'}/payment-status?subscription_id={id}`,
      completionUrl: `${process.env.RETURN_URL_BASE || 'http://localhost:5173'}/dashboard`,
      customer: {
        name: user_data.full_name || user_data.name || 'Cliente',
        email: user_data.email,
        taxId: user_data.cpf
      },
      allowCoupons: false
    };

    // Create AbacatePay billing
    const response = await axios.post(
      'https://api.abacatepay.com/v1/billing/create',
      billingData,
      {
        headers: {
          Authorization: `Bearer ${process.env.ABACATEPAY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const billingResult = response.data.data;
    const billingId = billingResult.id;
    const paymentUrl = billingResult.url;

    // Log subscription event
    await updateSupabase('subscription_events', {
      user_id,
      subscription_id: billingId,
      event_type: 'created',
      event_data: {
        payment_method: 'abacatepay_pix',
        abacatepay_response: billingResult,
        payment_url: paymentUrl,
        proxy_processed: true
      }
    });

    // Update user profile
    await updateSupabase('user_profiles?user_id=eq.' + user_id, {
      assinatura_ativa: false,
      assinatura_id: billingId,
      data_assinatura: new Date().toISOString(),
      proximo_pagamento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, 'PATCH');

    // Record payment
    await updateSupabase('pagamentos', {
      user_id,
      assinatura_id: billingId,
      valor: 9.90,
      metodo_pagamento: 'abacatepay_pix',
      status: 'pending',
      efi_charge_id: billingId // reusing existing field for AbacatePay billing ID
    });

    logger.info('AbacatePay billing created successfully', { 
      billing_id: billingId,
      user_id 
    });

    res.json({
      success: true,
      redirect_url: paymentUrl,
      subscription_id: billingId,
      payment_method: 'abacatepay_pix',
      billing_id: billingId
    });

  } catch (error) {
    logger.error('Error creating AbacatePay billing:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      error: 'Failed to create AbacatePay billing',
      message: error.message,
      code: error.response?.status || 'INTERNAL_ERROR'
    });
  }
});

// AbacatePay Webhook handler
app.post('/webhook/abacatepay', async (req, res) => {
  try {
    logger.info('Received AbacatePay webhook', { 
      body: req.body, 
      query: req.query,
      headers: req.headers 
    });

    // Validate webhook secret
    const webhookSecret = req.query.webhookSecret;
    if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
      logger.warn('Invalid webhook secret', { received: webhookSecret });
      return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
    }

    const { event, data } = req.body;
    
    if (event === 'billing.paid' && data.billing?.status === 'PAID') {
      const billingId = data.billing.id;
      
      // Find payment by billing ID
      const payments = await updateSupabase(
        `pagamentos?efi_charge_id=eq.${billingId}`, 
        {}, 
        'GET'
      );

      if (payments && payments.length > 0) {
        const payment = payments[0];
        
        // Update payment status
        await updateSupabase(`pagamentos?id=eq.${payment.id}`, {
          status: 'confirmed',
          updated_at: new Date().toISOString()
        }, 'PATCH');

        // Activate subscription
        await updateSupabase(`user_profiles?user_id=eq.${payment.user_id}`, {
          assinatura_ativa: true,
          updated_at: new Date().toISOString()
        }, 'PATCH');

        // Log subscription event
        await updateSupabase('subscription_events', {
          user_id: payment.user_id,
          subscription_id: billingId,
          event_type: 'paid',
          event_data: data
        });

        logger.info('AbacatePay payment confirmed and subscription activated', {
          billing_id: billingId,
          user_id: payment.user_id
        });
      } else {
        logger.warn('Payment not found for billing ID', { billing_id: billingId });
      }
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Error processing AbacatePay webhook:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// EFI Webhook handler
app.post('/webhook/efi', async (req, res) => {
  try {
    logger.info('Received EFI webhook', { body: req.body });

    const { pix } = req.body;
    
    if (!pix || !pix.length) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    for (const pixEvent of pix) {
      if (pixEvent.txid) {
        // Find payment by txid
        const payments = await updateSupabase(
          `pagamentos?efi_charge_id=eq.${pixEvent.txid}`, 
          {}, 
          'GET'
        );

        if (payments && payments.length > 0) {
          const payment = payments[0];
          
          // Update payment status
          await updateSupabase(`pagamentos?id=eq.${payment.id}`, {
            status: 'confirmed',
            updated_at: new Date().toISOString()
          }, 'PATCH');

          // Activate subscription
          await updateSupabase(`user_profiles?user_id=eq.${payment.user_id}`, {
            assinatura_ativa: true,
            updated_at: new Date().toISOString()
          }, 'PATCH');

          logger.info('Payment confirmed and subscription activated', {
            txid: pixEvent.txid,
            user_id: payment.user_id
          });
        }
      }
    }

    res.json({ success: true });

  } catch (error) {
    logger.error('Error processing EFI webhook:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`EFI Payment Proxy server running on port ${PORT}`);
  logger.info(`Environment: ${EFI_SANDBOX ? 'Sandbox' : 'Production'}`);
});