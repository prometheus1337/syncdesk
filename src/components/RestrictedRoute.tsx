import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';

interface RestrictedRouteProps {
  roles: UserRole[];
}

export function RestrictedRoute({ roles }: RestrictedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(user.role as UserRole)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
} 