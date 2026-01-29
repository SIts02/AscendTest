import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="glass-card p-8 md:p-12 max-w-md text-center dark:bg-gray-800/50 dark:border-gray-700">
        <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">Oops! Página não encontrada</p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <a href="/">
          <Button className="bg-momoney-500 hover:bg-momoney-600 neo-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;