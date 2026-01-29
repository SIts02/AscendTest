import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Carregando..." }: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-momoney-600 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{message}</h2>
        <p className="text-gray-500 dark:text-gray-400">Aguarde um momento, você será redirecionado em breve.</p>
      </div>
    </div>
  );
};