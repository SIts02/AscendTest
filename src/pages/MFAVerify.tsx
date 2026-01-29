import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ascendLogo from '@/assets/ascend-logo.png';

export default function MFAVerify() {
  const navigate = useNavigate();
  const { verifiedFactors, challengeAndVerify, isVerifying, needsMFAVerification, isLoading } = useMFA();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!isLoading && !needsMFAVerification && verifiedFactors.length === 0) {
      navigate('/dashboard');
    }
  }, [isLoading, needsMFAVerification, verifiedFactors, navigate]);

  const handleVerify = async () => {
    if (code.length !== 6 || verifiedFactors.length === 0) return;

    const result = await challengeAndVerify(verifiedFactors[0].id, code);
    if (result.success) {
      toast.success('Verificação concluída!');
      navigate('/dashboard');
    } else {
      setCode('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={ascendLogo} alt="Logo" className="h-12" />
          </div>
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verificação de Dois Fatores</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos do seu aplicativo autenticador
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Não consegue acessar seu aplicativo autenticador? Entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}