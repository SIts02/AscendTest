import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const LandingAuthButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) setHidden(true);
    else setHidden(false);
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu da sua conta');
  };

  if (user) {
    return (
      <motion.div
        className="fixed top-4 right-4 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-sm border-white/10 text-white">
            <DropdownMenuItem className="text-gray-400 focus:text-gray-400 focus:bg-transparent cursor-default">
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/dashboard')}
              className="text-blue-400 focus:text-blue-400 focus:bg-white/10 cursor-pointer"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Acessar Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to="/login">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10"
        >
          <User className="h-5 w-5" />
        </Button>
      </Link>
    </motion.div>
  );
};

export default LandingAuthButton;