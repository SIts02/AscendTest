import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LandingForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Digite seu email'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error) {
      // Error already handled in context
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">Email enviado!</h1>
              <p className="text-gray-400 mb-6">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
              <Link to="/login"><Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para login</Button></Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Recuperar senha</h1>
                <p className="text-gray-400">Digite seu email para receber o link de recuperação.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar link de recuperação'}
                </Button>
              </form>
              <p className="text-center text-gray-400 mt-6"><Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center"><ArrowLeft className="mr-1 h-4 w-4" />Voltar para login</Link></p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LandingForgotPassword;
