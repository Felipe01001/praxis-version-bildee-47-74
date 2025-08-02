
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';

const VerifyEmail = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-praxis-text">
            Confirme seu Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-500">
              <Mail className="h-10 w-10" />
            </div>
          </div>
          <h3 className="text-lg font-medium">Verifique sua Caixa de Entrada</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Enviamos um email com um link de confirmação para ativar sua conta.
            Por favor, verifique sua caixa de entrada e clique no link para completar o cadastro.
          </p>
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Não recebeu o email? Verifique sua pasta de spam ou solicite um novo link.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link to="/auth/login" className="w-full">
            <Button 
              variant="ghost" 
              className="w-full flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
