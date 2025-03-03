import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Image,
  Flex,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.svg';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, appUser, loading: authLoading } = useAuth();
  const toast = useToast();

  console.log('LoginPage: Renderizando. authLoading:', authLoading, 'appUser:', appUser ? 'existe' : 'não existe');

  // Redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    console.log('LoginPage useEffect: authLoading:', authLoading, 'appUser:', appUser ? 'existe' : 'não existe');
    
    if (appUser && !authLoading) {
      console.log('LoginPage: Usuário já autenticado, redirecionando para /refunds');
      navigate('/refunds', { replace: true });
    }
  }, [appUser, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      console.log('LoginPage: Tentando fazer login com email:', email);
      await signIn(email, password);
      
      console.log('LoginPage: Login bem-sucedido, aguardando atualização do appUser');
      
      // O redirecionamento será feito pelo useEffect quando appUser for atualizado
      toast({
        title: 'Login realizado com sucesso',
        status: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      console.error('LoginPage: Erro ao fazer login:', error);
      
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
      setLoading(false);
    }
  }

  // Se estiver carregando a autenticação, não mostra a tela de login ainda
  if (authLoading) {
    console.log('LoginPage: Exibindo tela de carregamento');
    return (
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <Text>Carregando...</Text>
      </Box>
    );
  }

  console.log('LoginPage: Exibindo formulário de login');
  return (
    <Box
      width="100vw"
      height="100vh"
      bg="gray.50"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="white"
        p="8"
        borderRadius="md"
        boxShadow="0px 4px 10px rgba(0, 0, 0, 0.05)"
        width="100%"
        maxWidth="400px"
        mx="4"
      >
        <Flex 
          justifyContent="center" 
          mb="4"
        >
          <Image 
            src={logo} 
            alt="PVO System Logo" 
            maxWidth="180px" 
            height="auto"
          />
        </Flex>
        
        <Text
          color="gray.600"
          fontSize="md"
          mb="8"
          textAlign="center"
        >
          Faça login para acessar o sistema
        </Text>

        <form onSubmit={handleSubmit}>
          <FormControl mb="4">
            <FormLabel color="gray.700">Email</FormLabel>
            <Input
              name="email"
              type="email"
              placeholder="seu@email.com"
              bg="white"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              _focus={{ borderColor: "gray.400", boxShadow: "none" }}
              size="md"
              required
            />
          </FormControl>

          <FormControl mb="6">
            <FormLabel color="gray.700">Senha</FormLabel>
            <Input
              name="password"
              type="password"
              placeholder="********"
              bg="white"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              _focus={{ borderColor: "gray.400", boxShadow: "none" }}
              size="md"
              required
            />
          </FormControl>

          <Button
            type="submit"
            width="100%"
            height="40px"
            isLoading={loading}
            bg="#FFDB01"
            color="black"
            _hover={{ bg: "#e5c501" }}
            _active={{ bg: "#d4b701" }}
          >
            Entrar
          </Button>
        </form>
      </Box>
    </Box>
  );
}

export default LoginPage; 