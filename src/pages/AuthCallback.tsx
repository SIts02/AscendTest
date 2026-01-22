
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Process the auth callback
    const handleAuthCallback = async () => {
      try {
        // Detect which type of authentication action is happening
        const url = new URL(window.location.href);
        const isPasswordReset = url.hash.includes('type=recovery') || url.search.includes('type=recovery');
        
        // Process URL hash/fragment or query parameters
        if (window.location.hash || window.location.search) {
          await supabase.auth.getSession();
        }
        
        // Get session after processing
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (isPasswordReset) {
          // Redirect to password reset page
          toast.success("Link de recuperação verificado! Defina sua nova senha.");
          navigate("/reset-password");
          return;
        }

        if (data?.session) {
          // If we have an active session, create a smooth transition to dashboard
          toast.success("Autenticação realizada com sucesso!");
          
          // Create transition overlay for smooth navigation
          const transitionOverlay = document.createElement('div');
          transitionOverlay.className = 'login-transition';
          
          const loadingSpinner = document.createElement('div');
          loadingSpinner.className = 'login-spinner';
          
          const centerContainer = document.createElement('div');
          centerContainer.className = 'flex items-center justify-center h-full';
          centerContainer.appendChild(loadingSpinner);
          
          transitionOverlay.appendChild(centerContainer);
          document.body.appendChild(transitionOverlay);
          
          // Fade in
          setTimeout(() => {
            transitionOverlay.classList.add('active');
          }, 50);
          
          // Navigate after animation
          setTimeout(() => {
            window.location.href = '/#/dashboard';
            
            // Fade out after navigation
            setTimeout(() => {
              transitionOverlay.classList.remove('active');
              
              // Remove element after fade out
              setTimeout(() => {
                document.body.removeChild(transitionOverlay);
              }, 500);
            }, 300);
          }, 800);
        } else {
          // No session, go to login
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
