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
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'support' | 'commercial';
  created_at: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
    <Box minH="100vh" bg="gray.50" p={6}>
      <Box maxW="1200px" mx="auto">
        <Box mb="8">
          <Heading
            as="h1"
            fontSize="24px"
            fontWeight="500"
            color="gray.700"
            mb="2"
          >
            Gerenciamento de Usuários
          </Heading>
          <Text color="gray.500">
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

        <Box bg="white" borderRadius="md" boxShadow="sm" overflow="hidden">
          <TableContainer>
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.600">NOME</Th>
                  <Th color="gray.600">EMAIL</Th>
                  <Th color="gray.600">FUNÇÃO</Th>
                  <Th color="gray.600">CRIADO EM</Th>
                  <Th color="gray.600">AÇÕES</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td>{user.full_name}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          user.role === 'admin'
                            ? 'red'
                            : user.role === 'support'
                            ? 'green'
                            : 'blue'
                        }
                        borderRadius="full"
                        px="2"
                        py="1"
                        fontSize="xs"
                      >
                        {user.role}
                      </Badge>
                    </Td>
                    <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
                    <Td>
                      <IconButton
                        aria-label="Editar usuário"
                        icon={<EditIcon color="black" />}
                        size="sm"
                        mr="2"
                        onClick={() => { setSelectedUser(user); onOpen(); }}
                        isLoading={isLoading}
                        bg="white"
                        borderColor="gray.200"
                        _hover={{ bg: "gray.50" }}
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
          <ModalContent>
            <ModalHeader>
              {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb="6">
              <form onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}>
                <FormControl mb="4" isRequired>
                  <FormLabel>Nome Completo</FormLabel>
                  <Input
                    name="full_name"
                    defaultValue={selectedUser?.full_name}
                    placeholder="Digite o nome completo"
                    bg="white"
                    borderColor="gray.200"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  />
                </FormControl>

                {!selectedUser && (
                  <>
                    <FormControl mb="4" isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Digite o email"
                        bg="white"
                        borderColor="gray.200"
                        _hover={{ borderColor: "gray.300" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                      />
                    </FormControl>

                    <FormControl mb="4" isRequired>
                      <FormLabel>Senha</FormLabel>
                      <Input
                        name="password"
                        type="password"
                        placeholder="Digite a senha"
                        bg="white"
                        borderColor="gray.200"
                        _hover={{ borderColor: "gray.300" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                      />
                    </FormControl>
                  </>
                )}

                <FormControl mb="6" isRequired>
                  <FormLabel>Função</FormLabel>
                  <Select
                    name="role"
                    defaultValue={selectedUser?.role || 'commercial'}
                    bg="white"
                    borderColor="gray.200"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                  >
                    <option value="admin">Administrador</option>
                    <option value="support">Suporte</option>
                    <option value="commercial">Comercial</option>
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
      role: formData.get('role') as 'admin' | 'support' | 'commercial',
    };

    try {
      // NOTA: Para desativar a confirmação de email no Supabase:
      // 1. Acesse o painel de administração do Supabase
      // 2. Vá para Authentication > Settings > Email
      // 3. Desative a opção "Enable email confirmations"
      // Isso é uma configuração global que afeta todos os usuários
      
      // Cria o usuário com a API normal
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

      toast({
        title: 'Usuário criado com sucesso',
        description: 'Nota: O usuário precisará confirmar o email antes de fazer login',
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

  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const userData = {
      full_name: formData.get('full_name') as string,
      role: formData.get('role') as 'admin' | 'support' | 'commercial',
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