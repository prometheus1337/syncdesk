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
  useToast,
  Heading,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { UserForm } from './UserForm';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }

  const handleCreateUser = async (userData: { name: string; email: string; role: string }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: 'changeme123',
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('app_users')
        .insert([
          {
            id: authData.user?.id,
            email: userData.email,
            full_name: userData.name,
            role: userData.role,
          },
        ]);

      if (profileError) throw profileError;

      toast({
        title: 'Usuário criado com sucesso',
        description: 'Um email foi enviado para o usuário com as instruções de acesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Usuários</Heading>
        <Button colorScheme="blue" onClick={onOpen}>
          Novo Usuário
        </Button>
      </HStack>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Cargo</Th>
            <Th>Data de Criação</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.full_name}</Td>
              <Td>{user.email}</Td>
              <Td>{user.role}</Td>
              <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Usuário</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <UserForm onSubmit={handleCreateUser} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 