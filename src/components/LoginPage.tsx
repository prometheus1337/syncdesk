import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Image,
  Container,
  Card,
  CardBody,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { appUser, loading: authLoading } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const pageBgColor = useColorModeValue('gray.50', 'gray.800');

  if (authLoading) {
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="#FFDB01" />
      </Box>
    );
  }

  if (appUser) {
    navigate('/');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={pageBgColor}
    >
      <Container maxW="md">
        <Card variant="outline" bg={bgColor}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Image
                  src="/syncdeskfav.svg"
                  alt="Logo"
                  mx="auto"
                  mb={4}
                  width="100px"
                />
                <Text fontSize="2xl" fontWeight="bold" mb={1} color={textColor}>
                  Bem-vindo ao Syncdesk
                </Text>
                <Text color={mutedTextColor}>
                  Faça login para continuar
                </Text>
              </Box>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel color={textColor}>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Digite seu email"
                      bg={bgColor}
                      color={textColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                      _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor}>Senha</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      bg={bgColor}
                      color={textColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                      _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    width="100%"
                    bg="#FFDB01"
                    color="black"
                    _hover={{ bg: "#e5c501" }}
                    isLoading={isLoading}
                  >
                    Entrar
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
} 