import { Box, Button, Container, Flex, HStack, Image, Menu, MenuButton, MenuItem, MenuList, Text, useToast } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.svg';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { appUser, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Erro ao sair',
        description: 'Ocorreu um erro ao tentar sair. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="1600px">
          <Flex justify="space-between" align="center">
            <Link to="/">
              <Image src={logo} alt="Logo" h="40px" />
            </Link>

            <HStack spacing={6}>
              {/* Link para Relatórios - todos os usuários têm acesso */}
              <Link to="/relatorios">
                <Text color="gray.600" _hover={{ color: 'black' }}>
                  Relatórios
                </Text>
              </Link>

              {/* Link para Documentos - todos exceto commercial têm acesso */}
              {['admin', 'support', 'essay_director', 'designer'].includes(appUser?.role || '') && (
                <Link to="/documentos">
                  <Text color="gray.600" _hover={{ color: 'black' }}>
                    Documentos
                  </Text>
                </Link>
              )}

              {/* Link para Gerador de Imagens - apenas admin e designer têm acesso */}
              {['admin', 'designer'].includes(appUser?.role || '') && (
                <Link to="/images">
                  <Text color="gray.600" _hover={{ color: 'black' }}>
                    Gerador de Imagens
                  </Text>
                </Link>
              )}

              {/* Link para Admin - apenas admin tem acesso */}
              {appUser?.role === 'admin' && (
                <Link to="/admin">
                  <Text color="gray.600" _hover={{ color: 'black' }}>
                    Admin
                  </Text>
                </Link>
              )}

              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  variant="ghost"
                >
                  {appUser?.email}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={handleSignOut}>Sair</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="1600px" py={8}>
        {children}
      </Container>
    </Box>
  );
} 