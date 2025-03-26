import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface PrivateRouteProps {
  children?: ReactNode;
  requiredRole?: 'admin' | 'support' | 'essay_director' | 'cs' | 'ambassador';
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { appUser, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!appUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && appUser.role !== requiredRole && appUser.role !== 'admin') {
    return <div>Acesso negado</div>;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute; 