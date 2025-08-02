import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, ArrowRight, ArrowLeft, Eye, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { TransactionDetailsModal } from '@/components/payment/TransactionDetailsModal';

const PaymentStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'failed' | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const subscriptionId = searchParams.get('subscription_id');
  const qrCodeBase64 = searchParams.get('qr_code_base64') ? decodeURIComponent(searchParams.get('qr_code_base64')!) : null;
  const pixCode = searchParams.get('pix_code') ? decodeURIComponent(searchParams.get('pix_code')!) : null;

  // Debug logs
  console.log('PaymentStatus - URL Params:', {
    subscriptionId,
    qrCodeBase64: qrCodeBase64?.substring(0, 50) + '...',
    pixCode: pixCode?.substring(0, 50) + '...',
    paymentStatus
  });

  useEffect(() => {
    if (!user || !subscriptionId) {
      navigate('/auth/login');
      return;
    }

    checkPaymentStatus();
    
    // Check status every 5 seconds for 2 minutes
    const interval = setInterval(checkPaymentStatus, 5000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 120000); // 2 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user, subscriptionId]);

  const checkPaymentStatus = async () => {
    if (!user || !subscriptionId) return;

    try {
      // Check local payment status first
      const { data: payment, error: paymentError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('user_id', user.id)
        .eq('assinatura_id', subscriptionId)
        .single();

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.error('Error checking payment:', paymentError);
        return;
      }

      // If payment is still pending, check with AbacatePay API
      if (payment && payment.status === 'pending' && payment.efi_charge_id) {
        try {
          console.log('Verificando pagamento no AbacatePay:', payment.efi_charge_id);
          
          // Get AbacatePay token from Supabase secrets via edge function
          const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-abacatepay-token');
          
          if (tokenError || !tokenData?.token) {
            console.error('Erro ao obter token AbacatePay:', tokenError);
            throw new Error('Token não disponível');
          }
          
          const abacateResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/${payment.efi_charge_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.token}`
            }
          });

          if (abacateResponse.ok) {
            const abacateData = await abacateResponse.json();
            console.log('Resposta AbacatePay:', abacateData);

            // Se o pagamento foi confirmado no AbacatePay
            if (abacateData.data?.status === 'PAID') {
              console.log('Pagamento confirmado no AbacatePay, ativando assinatura...');
              
              // Atualizar status do pagamento
              const { error: updatePaymentError } = await supabase
                .from('pagamentos')
                .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                .eq('id', payment.id);

              if (updatePaymentError) {
                console.error('Erro ao atualizar pagamento:', updatePaymentError);
              }

              // Ativar assinatura por 1 mês
              const nextPayment = new Date();
              nextPayment.setMonth(nextPayment.getMonth() + 1);

              const { error: profileError } = await supabase
                .from('user_profiles')
                .update({
                  assinatura_ativa: true,
                  assinatura_id: subscriptionId,
                  data_assinatura: new Date().toISOString(),
                  proximo_pagamento: nextPayment.toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

              if (profileError) {
                console.error('Erro ao ativar assinatura:', profileError);
              } else {
                setPaymentStatus('confirmed');
                toast.success('Pagamento confirmado! Sua assinatura está ativa.');
                return;
              }
            }
          }
        } catch (abacateError) {
          console.error('Erro ao verificar com AbacatePay:', abacateError);
          // Continue with local verification
        }
      }

      // Check subscription status
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('assinatura_ativa, assinatura_id, data_assinatura, proximo_pagamento')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
        return;
      }

      setSubscriptionData({
        payment,
        profile
      });

      if (profile?.assinatura_ativa && profile?.assinatura_id === subscriptionId) {
        setPaymentStatus('confirmed');
        toast.success('Pagamento confirmado! Sua assinatura está ativa.');
      } else if (payment?.status === 'confirmed') {
        setPaymentStatus('confirmed');
      } else if (payment?.status === 'failed') {
        setPaymentStatus('failed');
      } else {
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: 'Pagamento Confirmado!',
          description: 'Sua assinatura foi ativada com sucesso.',
          badgeVariant: 'default' as const,
          badgeText: 'Confirmado',
          buttonText: 'Acessar Sistema',
          buttonAction: () => navigate('/dashboard')
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: 'Pagamento Não Confirmado',
          description: 'Houve um problema com seu pagamento. Tente novamente.',
          badgeVariant: 'destructive' as const,
          badgeText: 'Falhou',
          buttonText: 'Tentar Novamente',
          buttonAction: () => navigate('/assinatura')
        };
      default:
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: 'Aguardando Confirmação',
          description: 'Estamos verificando seu pagamento. Isso pode levar alguns minutos.',
          badgeVariant: 'secondary' as const,
          badgeText: 'Pendente',
          buttonText: 'Verificar Novamente',
          buttonAction: () => checkPaymentStatus()
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando status do pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Status do Pagamento
              </h1>
              <p className="text-muted-foreground">
                Acompanhe o status da sua assinatura PRAXIS
              </p>
            </div>
          </div>

          {/* Status Card */}
          <Card className="mb-6">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {statusConfig.icon}
              </div>
              <CardTitle className="text-2xl mb-2">
                {statusConfig.title}
              </CardTitle>
              <Badge variant={statusConfig.badgeVariant} className="mx-auto">
                {statusConfig.badgeText}
              </Badge>
            </CardHeader>
            
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                {statusConfig.description}
              </p>

              {/* PIX Payment Section - Show when pending */}
              {paymentStatus === 'pending' && (
                <div className="space-y-4 mb-6">
                  {/* QR Code */}
                  {qrCodeBase64 && (
                    <div className="bg-white p-4 rounded-lg inline-block border">
                      <img 
                        src={qrCodeBase64.startsWith('data:image/') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code PIX" 
                        className="w-48 h-48 mx-auto"
                        onError={(e) => {
                          console.error('QR Code failed to load');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* PIX Copy Code */}
                  {pixCode && (
                    <div className="bg-muted p-3 rounded-lg text-left">
                      <div className="text-sm font-medium mb-2 text-center">Código PIX Copia e Cola</div>
                      <div className="p-2 bg-background rounded text-xs font-mono break-all mb-3 border">
                        {pixCode}
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(pixCode);
                          toast.success('Código PIX copiado!');
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar código PIX
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Escaneie o QR Code com o app do seu banco ou copie o código PIX
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={statusConfig.buttonAction}
                  className="w-full"
                  size="lg"
                >
                  {statusConfig.buttonText}
                  {paymentStatus === 'confirmed' && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>

                {/* Transaction Details Button */}
                <Button 
                  onClick={() => setShowDetailsModal(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes da Transação
                </Button>

                {paymentStatus === 'pending' && (
                  <p className="text-xs text-muted-foreground">
                    O sistema verifica automaticamente o status do pagamento. 
                    Se já efetuou o pagamento via PIX, aguarde alguns minutos.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Precisa de Ajuda?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Se você tem dúvidas sobre seu pagamento ou precisa de suporte, entre em contato conosco.
              </p>
              <Button variant="outline" size="sm">
                Falar com Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        subscriptionId={subscriptionId || ''}
        paymentStatus={paymentStatus || 'pending'}
        subscriptionData={subscriptionData}
        qrCodeBase64={qrCodeBase64 || undefined}
        pixCode={pixCode || undefined}
      />
    </div>
  );
};

export default PaymentStatus;