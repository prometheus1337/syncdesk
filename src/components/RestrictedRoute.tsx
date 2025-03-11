import { Navigate } from 'react-router-dom';
import { Box, Heading, Button, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface RestrictedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RestrictedRoute({ children, allowedRoles }: RestrictedRouteProps) {
  const { appUser } = useAuth();

  if (!appUser) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(appUser.role)) {
    return (
      <Box 
        minH="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <VStack spacing={6}>
          <Heading as="h1" size="xl">
            Acesso Restrito
          </Heading>
          <Button
            bg="#FFDB01"
            color="black"
            _hover={{ bg: "#e5c501" }}
            onClick={() => window.history.back()}
          >
            Voltar
          </Button>
        </VStack>
      </Box>
    );
  }

  return <>{children}</>;
} 