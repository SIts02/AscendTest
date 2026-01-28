import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface AdminRouteProps {
  children: JSX.Element;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}