import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {

    const handleAuthCallback = async () => {
      try {

        const url = new URL(window.location.href);
        const isPasswordReset = url.hash.includes('type=recovery') || url.search.includes('type=recovery');

        if (window.location.hash || window.location.search) {
          await supabase.auth.getSession();
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (isPasswordReset) {

          toast.success("Link de recuperação verificado! Defina sua nova senha.");
          navigate("/reset-password");
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const stateFromUrl = urlParams.get('state');
        const stateFromStorage = sessionStorage.getItem('oauth_state');

        if (stateFromUrl) {
          if (stateFromUrl !== stateFromStorage) {
            console.error('CSRF token mismatch');
            toast.error('Erro de segurança: token inválido');
            navigate('/login');
            return;
          }

          sessionStorage.removeItem('oauth_state');
        }

        if (data?.session) {

          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.session.user.id)
            .single();

          const userName = profileData?.name || data.session.user.email?.split('@')[0] || 'Usuário';

          toast.success(`Bem-vindo(a), ${userName}!`);

          const transitionOverlay = document.createElement('div');
          transitionOverlay.className = 'login-transition';

          const loadingSpinner = document.createElement('div');
          loadingSpinner.className = 'login-spinner';

          const centerContainer = document.createElement('div');
          centerContainer.className = 'flex items-center justify-center h-full';
          centerContainer.appendChild(loadingSpinner);

          transitionOverlay.appendChild(centerContainer);
          document.body.appendChild(transitionOverlay);

          setTimeout(() => {
            transitionOverlay.classList.add('active');
          }, 50);

          setTimeout(() => {
            window.location.href = '/#/dashboard';

            setTimeout(() => {
              transitionOverlay.classList.remove('active');

              setTimeout(() => {
                document.body.removeChild(transitionOverlay);
              }, 500);
            }, 300);
          }, 800);
        } else {

          navigate("/login");
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        toast.error(error.message || "Erro durante autenticação");
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <LoadingScreen message="Processando autenticação..." />;
};

export default AuthCallback;