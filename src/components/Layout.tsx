import { ReactNode } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Stack,
  Container,
  Avatar,
  Text,
  Image,
  useToast,
  Button,
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  CloseIcon,
  SettingsIcon,
  AddIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { FaFileAlt, FaChartBar, FaCoins, FaUserShield, FaUserTie } from 'react-icons/fa';
import LogoSVGFile from '../assets/logo.svg';

interface NavLinkProps {
  children: ReactNode;
  href: string;
  icon?: ReactNode;
}

function NavLink({ children, href, icon }: NavLinkProps) {
  return (
    <RouterLink to={href} style={{ textDecoration: 'none' }}>
      <Box
        px={2}
        py={1}
        rounded={'md'}
        _hover={{
          textDecoration: 'none',
          bg: '#FFDB01',
          color: 'black',
          outline: 'none',
        }}
        _focus={{
          outline: 'none',
          boxShadow: 'none',
        }}
      >
        <Flex align="center" gap={2}>
          {icon}
          {children}
        </Flex>
      </Box>
    </RouterLink>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  const getNavLinks = () => {
    const links = [];

    // Link para Dashboard do Embaixador - apenas embaixadores têm acesso
    if (appUser?.role === 'ambassador') {
      links.push({
        href: '/ambassador',
        label: 'Dashboard',
        icon: <FaChartBar />
      });
      return links;
    }

    // Link para Relatórios - todos os usuários exceto embaixadores têm acesso
    links.push({
      href: '/relatorios',
      label: 'Relatórios',
      icon: <FaChartBar />
    });

    // Link para Reembolsos - apenas admin e support têm acesso
    if (['admin', 'support'].includes(appUser?.role || '')) {
      links.push({
        href: '/reembolsos',
        label: 'Reembolsos',
        icon: <FaFileAlt />
      });
    }

    // Link para Documentos - todos exceto commercial têm acesso
    if (['admin', 'support', 'essay_director', 'designer'].includes(appUser?.role || '')) {
      links.push({
        href: '/documentos',
        label: 'Documentos',
        icon: <FaFileAlt />
      });
    }

    // Link para Gerador de Imagens - apenas admin e designer têm acesso
    if (['admin', 'designer'].includes(appUser?.role || '')) {
      links.push({ 
        href: '/images', 
        label: 'Gerador de Imagens',
        icon: <AddIcon />
      });
    }

    // Link para Admin - apenas admin tem acesso
    if (appUser?.role === 'admin') {
      links.push({ 
        href: '/admin', 
        label: 'Administração',
        icon: <SettingsIcon />
      });
    }

    // Link para Redações - apenas admin e essay_director têm acesso
    if (['admin', 'essay_director'].includes(appUser?.role || '')) {
      links.push({
        href: '/redacoes',
        label: 'Redações',
        icon: <FaFileAlt />
      });
    }

    // Link para Créditos - apenas admin e essay_director têm acesso
    if (['admin', 'essay_director'].includes(appUser?.role || '')) {
      links.push({
        href: '/redacoes/creditos',
        label: 'Créditos',
        icon: <FaCoins />
      });
    }

    // Link para Painel CS - apenas admin e cs têm acesso
    if (['admin', 'cs'].includes(appUser?.role || '')) {
      links.push({
        href: '/cs',
        label: 'Painel CS',
        icon: <FaChartBar />
      });
    }
    
    return links;
  };

  // Estilo para remover contornos
  const noOutlineStyle = {
    outline: 'none',
    boxShadow: 'none',
    border: 'none'
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box
        bg="white"
        px={4}
        boxShadow="sm"
        position="fixed"
        width="full"
        zIndex="sticky"
      >
        <Container maxW="container.2xl">
          <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
            <HStack spacing={8} alignItems={'center'}>
              <IconButton
                size={'md'}
                icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                aria-label={'Open Menu'}
                display={{ md: 'none' }}
                onClick={isOpen ? onClose : onOpen}
              />
              <Box>
                <RouterLink to="/">
                  <Image src={LogoSVGFile} alt="Logo" h="30px" />
                </RouterLink>
              </Box>
            </HStack>
            
            <Flex alignItems={'center'}>
              <HStack spacing={4} mr={4} display={{ base: 'none', md: 'flex' }}>
                {getNavLinks().map((link) => (
                  <NavLink key={link.href} href={link.href} icon={link.icon}>
                    {link.label}
                  </NavLink>
                ))}
                {appUser?.role === 'admin' && (
                  <>
                    <Button
                      as={RouterLink}
                      to="/admin"
                      variant="ghost"
                      leftIcon={<FaUserShield />}
                      colorScheme="yellow"
                    >
                      Admin
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/admin/ambassadors"
                      variant="ghost"
                      leftIcon={<FaUserTie />}
                      colorScheme="yellow"
                    >
                      Embaixadores
                    </Button>
                  </>
                )}
              </HStack>

              <Menu>
                <MenuButton
                  as="button"
                  style={noOutlineStyle}
                >
                  <HStack 
                    paddingRight="10px" 
                    paddingLeft="5px" 
                    paddingTop="5px" 
                    paddingBottom="5px" 
                    borderRadius="10px"
                    _hover={{
                      bg: '#FFDB01',
                      ...noOutlineStyle
                    }}
                    _focus={noOutlineStyle}
                    _active={noOutlineStyle}
                    style={noOutlineStyle}
                  >
                    <Avatar
                      size={'sm'}
                      name={appUser?.full_name}
                      bg="#FFDB01"
                      color="black"
                    />
                    <Text 
                      display={{ base: 'none', md: 'block' }}
                      color="black"
                    >
                      {appUser?.full_name}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem 
                    onClick={handleSignOut}
                    _focus={noOutlineStyle}
                    _active={noOutlineStyle}
                    _hover={{ bg: 'transparent' }}
                    autoFocus={false}
                  >
                    Sair
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>

          {isOpen ? (
            <Box pb={4} display={{ md: 'none' }}>
              <Stack as={'nav'} spacing={4}>
                {getNavLinks().map((link) => (
                  <NavLink key={link.href} href={link.href} icon={link.icon}>
                    {link.label}
                  </NavLink>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Container>
      </Box>

      <Container maxW="container.2xl" pt="20" px={4}>
        <Box
          mx="auto"
          py={8}
          maxW="100%"
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
} 