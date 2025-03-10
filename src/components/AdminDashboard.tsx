import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Badge,
  IconButton,
  Heading,
  Text,
  TableContainer,
  Flex,
  Spacer,
  ModalFooter,
  useColorModeValue,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'support' | 'commercial' | 'essay_director';
  created_at: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const toast = useToast();
  const { appUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUsers(data || []);
    setIsLoading(false);
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'admin':
        return 'red';
      case 'support':
        return 'green';
      case 'essay_director':
        return 'purple';
      default:
        return 'blue';
    }
  }

  function translateRole(role: string) {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'support':
        return 'Suporte';
      case 'commercial':
        return 'Comercial';
      case 'essay_director':
        return 'Diretor de Redação';
      default:
        return role;
    }
  }

  if (!appUser || appUser.role !== 'admin') {
    return (
      <Box minH="100vh" bg="gray.50" p={6}>
        <Box maxW="1200px" mx="auto">
          <Text>Acesso negado. Apenas administradores podem acessar esta página.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')} p={6}>
      <Box maxW="1200px" mx="auto">
        <Box mb="8">
          <Heading
            as="h1"
            fontSize="24px"
            fontWeight="500"
            color={textColor}
            mb="2"
          >
            Gerenciamento de Usuários
          </Heading>
          <Text color={mutedTextColor}>
            Gerencie os usuários do sistema e suas permissões
          </Text>
        </Box>

        <Flex mb="6">
          <Spacer />
          <Button
            leftIcon={<AddIcon />}
            bg="#FFDB01"
            color="black"
            _hover={{ bg: "#e5c501" }}
            onClick={() => { setSelectedUser(null); onOpen(); }}
            isLoading={isLoading}
            size="md"
            px="6"
          >
            Novo Usuário
          </Button>
        </Flex>

        <Box bg={bgColor} borderRadius="md" boxShadow="sm" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
          <TableContainer>
            <Table variant="simple">
              <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                <Tr>
                  <Th color={mutedTextColor}>NOME</Th>
                  <Th color={mutedTextColor}>EMAIL</Th>
                  <Th color={mutedTextColor}>FUNÇÃO</Th>
                  <Th color={mutedTextColor}>CRIADO EM</Th>
                  <Th color={mutedTextColor}>AÇÕES</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id} _hover={{ bg: hoverBgColor }}>
                    <Td color={textColor}>{user.full_name}</Td>
                    <Td color={textColor}>{user.email}</Td>
                    <Td>
                      <Badge
                        colorScheme={getRoleBadgeColor(user.role)}
                        borderRadius="full"
                        px="2"
                        py="1"
                        fontSize="xs"
                      >
                        {translateRole(user.role)}
                      </Badge>
                    </Td>
                    <Td color={textColor}>{new Date(user.created_at).toLocaleDateString()}</Td>
                    <Td>
                      <IconButton
                        aria-label="Editar usuário"
                        icon={<EditIcon />}
                        size="sm"
                        mr="2"
                        onClick={() => { setSelectedUser(user); onOpen(); }}
                        isLoading={isLoading}
                        bg={bgColor}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ bg: hoverBgColor }}
                      />
                      <IconButton
                        aria-label="Excluir usuário"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteUser(user.id)}
                        isLoading={isLoading}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader color={textColor}>
              {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
            </ModalHeader>
            <ModalCloseButton color={textColor} />
            <ModalBody pb="6">
              <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
                <FormControl mb="4" isRequired>
                  <FormLabel color={textColor}>Nome Completo</FormLabel>
                  <Input
                    name="full_name"
                    defaultValue={selectedUser?.full_name}
                    placeholder="Digite o nome completo"
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                    _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  />
                </FormControl>

                {!selectedUser && (
                  <>
                    <FormControl mb="4" isRequired>
                      <FormLabel color={textColor}>Email</FormLabel>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Digite o email"
                        bg={bgColor}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                        _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                      />
                    </FormControl>

                    <FormControl mb="4" isRequired>
                      <FormLabel color={textColor}>Senha</FormLabel>
                      <Input
                        name="password"
                        type="password"
                        placeholder="Digite a senha"
                        bg={bgColor}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                        _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                      />
                    </FormControl>
                  </>
                )}

                <FormControl mb="6" isRequired>
                  <FormLabel color={textColor}>Função</FormLabel>
                  <Select
                    name="role"
                    defaultValue={selectedUser?.role || 'commercial'}
                    bg={bgColor}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                    _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  >
                    <option value="admin">Administrador</option>
                    <option value="support">Suporte</option>
                    <option value="commercial">Comercial</option>
                    <option value="essay_director">Diretor de Redação</option>
                  </Select>
                </FormControl>

                <Flex gap="3">
                  <Button
                    type="submit"
                    bg="#FFDB01"
                    color="black"
                    _hover={{ bg: "#e5c501" }}
                    isLoading={isLoading}
                    flex="1"
                  >
                    {selectedUser ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button 
                    onClick={onClose} 
                    flex="1"
                    bg="red.500"
                    color="white"
                    _hover={{ bg: "red.600" }}
                  >
                    Cancelar
                  </Button>
                </Flex>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>

        <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader color={textColor}>Confirme sua senha</ModalHeader>
            <ModalCloseButton color={textColor} />
            <ModalBody>
              <FormControl>
                <FormLabel color={textColor}>Digite sua senha para continuar</FormLabel>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Sua senha"
                  bg={bgColor}
                  color={textColor}
                  borderColor={borderColor}
                  _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                  _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleAdminRelogin}>
                Confirmar
              </Button>
              <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const userData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
      role: formData.get('role') as 'admin' | 'support' | 'commercial' | 'essay_director',
    };

    try {
      // Salva o usuário atual
      const currentSession = await supabase.auth.getSession();
      const currentUser = currentSession.data.session?.user;
      setCurrentUserEmail(currentUser?.email || '');

      // Cria o novo usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      });

      if (authError) throw authError;

      // Insere o usuário na tabela app_users
      const { error: appError } = await supabase.from('app_users').insert({
        id: authData.user?.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      });

      if (appError) throw appError;

      // Abre o modal de senha
      setIsPasswordModalOpen(true);

      toast({
        title: 'Usuário criado com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdminRelogin() {
    try {
      await supabase.auth.signInWithPassword({
        email: currentUserEmail,
        password: adminPassword,
      });
      setIsPasswordModalOpen(false);
      setAdminPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const userData = {
      full_name: formData.get('full_name') as string,
      role: formData.get('role') as 'admin' | 'support' | 'commercial' | 'essay_director',
    };

    try {
      const { error } = await supabase
        .from('app_users')
        .update(userData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Usuário atualizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Usuário excluído com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }
} 