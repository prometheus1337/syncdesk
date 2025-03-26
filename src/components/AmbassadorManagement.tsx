import { useEffect, useState } from 'react';
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
  Heading,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';
import { Layout } from './Layout';

interface Ambassador {
  id: string;
  user_id: string;
  name: string;
  email: string;
  metabase_question_id: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function AmbassadorManagement() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [questionId, setQuestionId] = useState<string>('');
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
    if (!selectedUser) {
      toast({
        title: 'Selecione um usuário',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!questionId.trim()) {
      toast({
        title: 'ID da questão inválido',
        description: 'Digite o ID da questão do Metabase',
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
          name: selectedUserData.full_name || selectedUserData.email,
          email: selectedUserData.email,
          metabase_question_id: questionId.trim(),
        },
      ]);

    if (error) {
      toast({
        title: 'Erro ao criar embaixador',
        description: error.message,
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
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Gerenciamento de Embaixadores</Heading>
          <Button colorScheme="blue" onClick={onOpen}>
            Adicionar Embaixador
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
                      {user.full_name || user.email}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>ID da Questão do Metabase</FormLabel>
                <Input
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                  placeholder="Digite o ID da questão do Metabase"
                  required
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
    </Layout>
  );
} 