import { ReactNode } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  Stack,
  Container,
  Avatar,
  Text,
  Image,
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  CloseIcon, 
  SettingsIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { FaFileAlt, FaChartBar } from 'react-icons/fa';
import { ImageIcon } from './icons/ImageIcon';

// Importar o logo SVG
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getNavLinks = () => {
    const links = [];

    if (appUser) {
      links.push({
        href: '/',
        label: 'Dashboard',
        icon: <FaChartBar />
      });

      links.push({
        href: '/docs',
        label: 'Documentos',
        icon: <FaFileAlt />
      });
      
      if (appUser.role === 'admin') {
        links.push({ 
          href: '/admin', 
          label: 'Administração',
          icon: <SettingsIcon />
        });
      }

      if (appUser.role === 'admin' || appUser.role === 'essay_director') {
        links.push({ 
          href: '/images', 
          label: 'Gerador de Imagens',
          icon: <ImageIcon />
        });
      }
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
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box
        bg={useColorModeValue('white', 'gray.800')}
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
                  <Image src={LogoSVGFile} alt="PVO System Logo" h="30px" />
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
              </HStack>
              
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                  _focus={noOutlineStyle}
                  _hover={{ textDecoration: 'none', ...noOutlineStyle }}
                  _active={noOutlineStyle}
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