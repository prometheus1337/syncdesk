import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user';
import { Box, Spinner } from '@chakra-ui/react';

interface RestrictedRouteProps {
  roles: UserRole[];
}

export const RestrictedRoute = ({ roles }: RestrictedRouteProps) => {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (!appUser) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(appUser.role)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}; 