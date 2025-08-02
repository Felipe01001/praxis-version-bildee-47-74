import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  paymentStatus: 'pending' | 'confirmed' | 'failed';
  subscriptionData: any;
  qrCodeBase64?: string;
  pixCode?: string;
}

export const TransactionDetailsModal = ({
  isOpen,
  onClose,
  subscriptionId,
  paymentStatus,
  subscriptionData,
  qrCodeBase64,
  pixCode
}: TransactionDetailsModalProps) => {
  // Debug logs
  console.log('TransactionDetailsModal - Props:', {
    qrCodeBase64: qrCodeBase64?.substring(0, 50) + '...',
    pixCode: pixCode?.substring(0, 50) + '...',
    paymentStatus,
    hasQrCode: !!qrCodeBase64
  });

  // Process QR code - handle different Base64 formats
  const processedQrCode = qrCodeBase64 ? 
    (qrCodeBase64.startsWith('data:image/') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`) 
    : null;
  const copyPixCode = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      toast.success('Código PIX copiado!');
    }
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return {
          variant: 'default' as const,
          text: 'Confirmado',
          color: 'text-green-600'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          text: 'Falhou',
          color: 'text-red-600'
        };
      default:
        return {
          variant: 'secondary' as const,
          text: 'Pendente',
          color: 'text-yellow-600'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Detalhes da Transação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Value */}
          <div className="text-center space-y-2">
            <Badge variant={statusConfig.variant} className="text-sm">
              {statusConfig.text}
            </Badge>
            <div className="text-2xl font-bold">R$ 9,90</div>
            <div className="text-sm text-muted-foreground">Mensalidade PRAXIS</div>
          </div>

          {/* QR Code Section - Only show if pending */}
          {paymentStatus === 'pending' && processedQrCode && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm font-medium">QR Code PIX</span>
                </div>
                <div className="bg-white p-3 rounded-lg inline-block mb-3">
                  <img 
                    src={processedQrCode}
                    alt="QR Code PIX" 
                    className="w-48 h-48 mx-auto"
                    onError={(e) => {
                      console.error('QR Code failed to load:', processedQrCode?.substring(0, 100));
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('QR Code loaded successfully');
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Escaneie com o app do seu banco
                </p>
              </CardContent>
            </Card>
          )}

          {/* Debug info for development */}
          {paymentStatus === 'pending' && !processedQrCode && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-yellow-700">
                  QR Code não disponível. Verificando dados...
                </p>
              </CardContent>
            </Card>
          )}

          {/* PIX Copy Code - Only show if pending */}
          {paymentStatus === 'pending' && pixCode && (
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium mb-2">Código PIX Copia e Cola</div>
                <div className="p-2 bg-muted rounded text-xs font-mono break-all mb-3">
                  {pixCode}
                </div>
                <Button 
                  onClick={copyPixCode}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar código PIX
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Transaction Details */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-3">Informações da Transação</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Público:</span>
                  <span className="font-mono">{subscriptionId?.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método:</span>
                  <span>PIX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>Assinatura Mensal</span>
                </div>
                {subscriptionData?.payment?.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>
                      {new Date(subscriptionData.payment.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {subscriptionData?.profile?.data_assinatura && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ativação:</span>
                    <span>
                      {new Date(subscriptionData.profile.data_assinatura).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {subscriptionData?.profile?.proximo_pagamento && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo:</span>
                    <span>
                      {new Date(subscriptionData.profile.proximo_pagamento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions for pending payments */}
          {paymentStatus === 'pending' && (
            <div className="text-xs text-muted-foreground text-center">
              O pagamento será confirmado automaticamente após o processamento.
              Tempo médio: 2-5 minutos.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};