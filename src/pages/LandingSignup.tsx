import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import GoogleIcon from '@/components/auth/GoogleIcon';
import { toast } from 'sonner';
import { signupFormSchema, getFirstError, VALIDATION_LIMITS } from '@/lib/validators';

/**
 * Signup page component with secure input validation
 * Following OWASP best practices for user registration
 */
const LandingSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= VALIDATION_LIMITS.PASSWORD_MIN,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  /**
   * Validate form inputs before submission
   * Uses schema-based validation for security
   */
  const validateForm = (): boolean => {
    const result = signupFormSchema.safeParse({ email, password, confirmPassword });
    
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof typeof errors;
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
    
    // Validate inputs before processing
    if (!validateForm()) return;
    
    setLoading(true);
    const { error } = await signUpWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);
    
    if (error) { 
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta'); 
      }
    } else { 
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.'); 
      navigate('/dashboard'); 
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled in context
    }
    setGoogleLoading(false);
  };

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${passed ? 'text-green-400' : 'text-gray-500'}`}>
      {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Landing Button */}
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
            <h1 className="text-2xl font-bold text-white mb-2">Criar sua conta</h1>
            <p className="text-gray-400">Comece sua jornada conosco hoje.</p>
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
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
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
                  autoComplete="new-password"
                  className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  aria-invalid={!!errors.password}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password}</p>
              )}
              
              {/* Password strength indicators */}
              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-white/5 rounded-lg">
                  <PasswordCheck passed={passwordChecks.length} label="8+ caracteres" />
                  <PasswordCheck passed={passwordChecks.lowercase} label="Letra minúscula" />
                  <PasswordCheck passed={passwordChecks.uppercase} label="Letra maiúscula" />
                  <PasswordCheck passed={passwordChecks.number} label="Número" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => {
                    const value = e.target.value.slice(0, VALIDATION_LIMITS.PASSWORD_MAX);
                    setConfirmPassword(value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
                  autoComplete="new-password"
                  className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                  aria-invalid={!!errors.confirmPassword}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword}</p>
              )}
              {confirmPassword && password !== confirmPassword && !errors.confirmPassword && (
                <p className="text-sm text-amber-400">As senhas não coincidem</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !allChecksPassed} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
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
            onClick={handleGoogleSignup} 
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
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Entre
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingSignup;
