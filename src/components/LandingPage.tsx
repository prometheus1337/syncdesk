import { Box, Button, Container, Heading, Text, VStack, Image, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box bg="gray.50" minH="100vh">
      {/* Hero Section */}
      <Box bg="white" py={20}>
        <Container maxW="container.xl">
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={10}>
            <VStack align="flex-start" spacing={6} flex={1}>
              <Image src={logo} alt="Logo" w="200px" mb={4} />
              <Heading size="2xl" color="gray.800" lineHeight="shorter">
                Gerencie seus reembolsos de forma simples e eficiente
              </Heading>
              <Text fontSize="xl" color="gray.600">
                Uma plataforma completa para administração de reembolsos e documentação.
              </Text>
              <Button 
                size="lg" 
                colorScheme="blue"
                onClick={() => navigate('/login')}
              >
                Acessar Plataforma
              </Button>
            </VStack>
            
            <Box flex={1}>
              <Image 
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80"
                alt="Dashboard illustration"
                borderRadius="xl"
                shadow="2xl"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20}>
        <Container maxW="container.xl">
          <VStack spacing={16}>
            <Heading textAlign="center" size="xl" color="gray.800">
              Recursos Principais
            </Heading>
            
            <Flex gap={8} direction={{ base: 'column', md: 'row' }}>
              <VStack 
                bg="white" 
                p={8} 
                borderRadius="xl" 
                shadow="md" 
                flex={1}
                spacing={4}
              >
                <Heading size="md">Gestão de Reembolsos</Heading>
                <Text textAlign="center" color="gray.600">
                  Processe e acompanhe reembolsos de forma eficiente e organizada.
                </Text>
              </VStack>

              <VStack 
                bg="white" 
                p={8} 
                borderRadius="xl" 
                shadow="md" 
                flex={1}
                spacing={4}
              >
                <Heading size="md">Documentação Centralizada</Heading>
                <Text textAlign="center" color="gray.600">
                  Acesse toda a documentação necessária em um único lugar.
                </Text>
              </VStack>

              <VStack 
                bg="white" 
                p={8} 
                borderRadius="xl" 
                shadow="md" 
                flex={1}
                spacing={4}
              >
                <Heading size="md">Controle de Acesso</Heading>
                <Text textAlign="center" color="gray.600">
                  Gerencie permissões e mantenha o controle total do sistema.
                </Text>
              </VStack>
            </Flex>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
} 