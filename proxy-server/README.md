# EFI Payment Proxy Server

Node.js proxy server for handling EFI Bank PIX payments with proper mTLS certificate support.

## Features

- ✅ mTLS certificate handling for production
- ✅ Token caching and retry logic
- ✅ Comprehensive logging with Winston
- ✅ Error handling and validation
- ✅ Webhook processing
- ✅ Supabase integration
- ✅ Health checks
- ✅ CORS and security headers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

4. For production, place your EFI certificates in the `certs/` directory:
   - `certificate.crt` - Your certificate
   - `private.key` - Private key
   - `ca.crt` - CA certificate

5. Create logs directory:
```bash
mkdir logs
```

## Development

Start development server:
```bash
npm run dev
```

## Production

Start production server:
```bash
npm start
```

## API Endpoints

### POST /create-pix
Creates a PIX charge for subscription payment.

**Request Body:**
```json
{
  "user_id": "uuid",
  "user_data": {
    "cpf": "12345678901",
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "subscription_id": "optional_custom_id"
}
```

**Response:**
```json
{
  "success": true,
  "redirect_url": "https://...",
  "subscription_id": "pix_xxx",
  "payment_method": "pix",
  "qr_code": "00020126...",
  "txid": "transaction_id"
}
```

### POST /webhook/efi
Handles EFI Bank webhooks for payment confirmations.

### GET /health
Health check endpoint.

## Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name efi-proxy
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `EFI_CLIENT_ID` | EFI Bank client ID | Yes |
| `EFI_CLIENT_SECRET` | EFI Bank client secret | Yes |
| `EFI_PIX_KEY` | PIX key for receiving payments | Yes |
| `EFI_SANDBOX` | Use sandbox environment | No (default: true) |
| `EFI_CERTIFICATE_PATH` | Path to mTLS certificate | Production only |
| `EFI_KEY_PATH` | Path to private key | Production only |
| `EFI_CA_PATH` | Path to CA certificate | Production only |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output in development

## Security

- CORS enabled for all origins (configure as needed)
- Helmet.js for security headers
- Request size limits
- Environment variable validation
- mTLS certificate validation in production