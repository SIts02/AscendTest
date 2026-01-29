import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import GoogleIcon from '@/components/auth/GoogleIcon';
import { toast } from 'sonner';
import { loginFormSchema, getFirstError, VALIDATION_LIMITS } from '@/lib/validators';

const FAILED_ATTEMPTS_KEY = 'login_failed_attempts';
const FAILED_ATTEMPTS_TIMESTAMP_KEY = 'login_failed_timestamp';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const LandingLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLockout = () => {
      try {
        const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
        const timestamp = parseInt(localStorage.getItem(FAILED_ATTEMPTS_TIMESTAMP_KEY) || '0', 10);
        const now = Date.now();
        const timeSinceLastAttempt = now - timestamp;

        if (attempts >= MAX_FAILED_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_DURATION_MS) {
          const remaining = Math.ceil((LOCKOUT_DURATION_MS - timeSinceLastAttempt) / 1000);
          setIsLockedOut(true);
          setLockoutTimeRemaining(remaining);

          const interval = setInterval(() => {
            const newRemaining = Math.ceil((LOCKOUT_DURATION_MS - (Date.now() - timestamp)) / 1000);
            if (newRemaining <= 0) {
              setIsLockedOut(false);
              localStorage.removeItem(FAILED_ATTEMPTS_KEY);
              localStorage.removeItem(FAILED_ATTEMPTS_TIMESTAMP_KEY);
              clearInterval(interval);
            } else {
              setLockoutTimeRemaining(newRemaining);
            }
          }, 1000);

          return () => clearInterval(interval);
        } else if (timeSinceLastAttempt >= LOCKOUT_DURATION_MS) {

          localStorage.removeItem(FAILED_ATTEMPTS_KEY);
          localStorage.removeItem(FAILED_ATTEMPTS_TIMESTAMP_KEY);
        }
      } catch (error) {
        console.warn('Error checking lockout:', error);
      }
    };

    checkLockout();
  }, []);

  const validateForm = (): boolean => {
    const result = loginFormSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};

      result.error.errors.forEach(err => {
        const field = err.path[0] as 'email' | 'password';
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });

      setErrors(fieldErrors);
      toast.error(getFirstError(result.error));
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) {
      const minutes = Math.floor(lockoutTimeRemaining / 60);
      const seconds = lockoutTimeRemaining % 60;
      toast.error(`Muitas tentativas falhas. Tente novamente em ${minutes}:${seconds.toString().padStart(2, '0')}`);
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {

      try {
        const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10) + 1;
        localStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());
        localStorage.setItem(FAILED_ATTEMPTS_TIMESTAMP_KEY, Date.now().toString());

        if (attempts >= MAX_FAILED_ATTEMPTS) {
          setIsLockedOut(true);
          setLockoutTimeRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          toast.error(`Muitas tentativas falhas. Conta bloqueada por 15 minutos.`);
        } else {

          if (attempts >= 3) {
            const delayMs = (attempts - 2) * 1000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }

          toast.error('Email ou senha incorretos');
        }
      } catch (storageError) {
        console.warn('Error tracking failed attempts:', storageError);
        toast.error('Email ou senha incorretos');
      }
    } else {

      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(FAILED_ATTEMPTS_TIMESTAMP_KEY);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {

    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </motion.div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Entrar na sua conta</h1>
            <p className="text-gray-400">Bem-vindo de volta! Digite seus dados abaixo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {

                    const value = e.target.value.slice(0, VALIDATION_LIMITS.EMAIL_MAX);
                    setEmail(value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  maxLength={VALIDATION_LIMITS.EMAIL_MAX}
                  autoComplete="email"
                  className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {

                    const value = e.target.value.slice(0, VALIDATION_LIMITS.PASSWORD_MAX);
                    setPassword(value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
                  autoComplete="current-password"
                  className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-500">ou continue com</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Continuar com Google
          </Button>

          <p className="text-center text-gray-400 mt-6">
            Não tem uma conta?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingLogin;