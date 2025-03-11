import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';

interface RestrictedRouteProps {
  roles: UserRole[];
}

export const RestrictedRoute = ({ roles }: RestrictedRouteProps) => {
  const { appUser } = useAuth();

  if (!appUser) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(appUser.role)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}; 