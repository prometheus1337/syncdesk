import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  useToast,
  Select,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

interface Ambassador {
  id: string;
  user_id: string;
  name: string;
  email: string;
  metabase_embed_code: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

export const AmbassadorManagement: React.FC = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [metabaseCode, setMetabaseCode] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchAmbassadors();
    fetchUsers();
  }, []);

  const fetchAmbassadors = async () => {
    const { data, error } = await supabase
      .from('ambassadors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao carregar embaixadores',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setAmbassadors(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users_view')
      .select('*');

    if (error) {
      toast({
        title: 'Erro ao carregar usuários',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setUsers(data || []);
  };

  const handleCreateAmbassador = async () => {
    if (!selectedUser || !metabaseCode) {
      toast({
        title: 'Preencha todos os campos',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const selectedUserData = users.find(u => u.id === selectedUser);
    if (!selectedUserData) return;

    const { error } = await supabase
      .from('ambassadors')
      .insert([
        {
          user_id: selectedUser,
          name: selectedUserData.user_metadata.full_name || selectedUserData.email,
          email: selectedUserData.email,
          metabase_embed_code: metabaseCode,
        },
      ]);

    if (error) {
      toast({
        title: 'Erro ao criar embaixador',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    toast({
      title: 'Embaixador criado com sucesso!',
      status: 'success',
      duration: 3000,
    });

    onClose();
    fetchAmbassadors();
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Button colorScheme="blue" onClick={onOpen}>
          Novo Embaixador
        </Button>
      </Box>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Data de Criação</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ambassadors.map((ambassador) => (
            <Tr key={ambassador.id}>
              <Td>{ambassador.name}</Td>
              <Td>{ambassador.email}</Td>
              <Td>{new Date(ambassador.created_at).toLocaleDateString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Embaixador</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Usuário</FormLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Selecione um usuário</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.user_metadata.full_name || user.email}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Código de Embed do Metabase</FormLabel>
              <Input
                value={metabaseCode}
                onChange={(e) => setMetabaseCode(e.target.value)}
                placeholder="Cole o código de embed do Metabase aqui"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleCreateAmbassador}>
              Criar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 