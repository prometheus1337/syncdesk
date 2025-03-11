import { Navigate } from 'react-router-dom';
import { Box, Heading, Button, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface RestrictedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RestrictedRoute({ children, allowedRoles }: RestrictedRouteProps) {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <Heading size="md">Carregando...</Heading>
      </Box>
    );
  }

  if (!appUser) {
    return <Navigate to="/login" />;
  }

  // Se for admin, tem acesso a tudo
  if (appUser.role === 'admin') {
    return <>{children}</>;
  }

  // Se não for admin, verifica se o cargo está na lista de permitidos
  if (!allowedRoles.includes(appUser.role)) {
    return (
      <VStack spacing={4} align="center" justify="center" h="100vh">
        <Heading as="h1" textAlign="center">
          Acesso Restrito
        </Heading>
        <Button
          onClick={() => window.history.back()}
          bg="#FFDB01"
          color="black"
          _hover={{ bg: "#e5c501" }}
        >
          Voltar
        </Button>
      </VStack>
    );
  }

  return <>{children}</>;
} 