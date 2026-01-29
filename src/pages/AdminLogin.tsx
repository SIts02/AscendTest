import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Loader2,
  Mail,
  Key,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, requestOTP, verifyOTP, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [ipCheckFailed, setIpCheckFailed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/feedbacks', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    try {
      const success = await requestOTP(email);
      if (success) {
        setOtpSent(true);
        setStep('otp');
        setCountdown(60);
      }
    } catch (error: any) {
      if (error.message === 'IP_NOT_AUTHORIZED') {
        setIpCheckFailed(true);
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Código deve ter 6 dígitos');
      return;
    }

    const success = await verifyOTP(email, otp);
    if (success) {
      navigate('/admin/feedbacks', { replace: true });
    }
  };

  if (ipCheckFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white">Acesso Negado</CardTitle>
            <CardDescription className="text-gray-300">
              Esta área é restrita e só pode ser acessada de um IP autorizado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-white">Acesso Admin</CardTitle>
            <CardDescription className="text-gray-300">
              Área restrita para administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                      placeholder="Digite seu email"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email || !email.includes('@')}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Solicitar Código
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Código de Acesso</Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Digite o código de 6 dígitos enviado para {email}
                  </p>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      className="pl-10 bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setOtpSent(false);
                    }}
                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/10"
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </div>
                {countdown > 0 && (
                  <p className="text-center text-sm text-gray-400">
                    Reenviar código em {countdown}s
                  </p>
                )}
                {countdown === 0 && otpSent && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRequestOTP}
                    className="w-full text-gray-400 hover:text-white"
                    disabled={loading}
                  >
                    Reenviar código
                  </Button>
                )}
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-gray-400 text-sm mt-4">
          Sistema de autenticação seguro via senha dinâmica
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;