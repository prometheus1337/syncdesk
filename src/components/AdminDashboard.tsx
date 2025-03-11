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
  FormControl,
  FormLabel,
  Input,
  useToast,
  Badge,
  IconButton,
  Heading,
  Text,
  TableContainer,
  ModalFooter,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserForm } from './UserForm';

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'support' | 'commercial' | 'essay_director' | 'designer';
  created_at: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
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

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'admin':
        return 'red';
      case 'support':
        return 'green';
      case 'essay_director':
        return 'purple';
      case 'designer':
        return 'blue';
      default:
        return 'gray';
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
      case 'designer':
        return 'Designer';
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

  const handleCreateUser = async (userData: { name: string; email: string; role: string; password?: string }) => {
    try {
      // Criar usuário na autenticação
      const { error: authError } = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password || 'changeme123',
          role: userData.role,
          name: userData.name
        }
      });

      if (authError) throw authError;

      toast({
        title: 'Usuário criado com sucesso',
        description: userData.password 
          ? 'O usuário pode fazer login com as credenciais fornecidas.'
          : 'Um email foi enviado para o usuário com as instruções de acesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateUser = async (userData: { name: string; email: string; role: string }) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          full_name: userData.name,
          email: userData.email,
          role: userData.role,
        })
        .eq('id', selectedUser?.id);

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
      console.error('Error updating user:', error);
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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

        <HStack justify="space-between" mb={6}>
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
        </HStack>

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
                        colorScheme={getRoleBadgeColor(user.role)}
                        borderRadius="full"
                        px="2"
                        py="1"
                        fontSize="xs"
                      >
                        {translateRole(user.role)}
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
              <UserForm 
                onSubmit={selectedUser ? handleUpdateUser : handleCreateUser} 
                initialData={selectedUser || undefined}
                isEditing={!!selectedUser}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Modal de senha do admin */}
        <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirme sua senha</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Digite sua senha para continuar</FormLabel>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Sua senha"
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

  async function handleAdminRelogin() {
    try {
      await supabase.auth.signInWithPassword({
        email: appUser?.email || '',
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