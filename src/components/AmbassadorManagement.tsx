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
}

export default function AmbassadorManagement() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ userId: '', metabaseQuestionId: '' });

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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (ambassador: Ambassador) => {
    setSelectedAmbassador(ambassador);
    setIsEditMode(true);
    setFormData({
      userId: ambassador.user_id,
      metabaseQuestionId: ambassador.metabase_question_id
    });
    onOpen();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditMode && selectedAmbassador) {
        // Atualizar embaixador existente
        const { error } = await supabase
          .from('ambassadors')
          .update({
            user_id: formData.userId,
            metabase_question_id: formData.metabaseQuestionId
          })
          .eq('id', selectedAmbassador.id);

        if (error) throw error;
        
        toast({
          title: 'Embaixador atualizado com sucesso!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Criar novo embaixador
        const { error } = await supabase
          .from('ambassadors')
          .insert([
            {
              user_id: formData.userId,
              metabase_question_id: formData.metabaseQuestionId
            }
          ]);

        if (error) throw error;

        toast({
          title: 'Embaixador adicionado com sucesso!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
      fetchAmbassadors();
      setFormData({ userId: '', metabaseQuestionId: '' });
      setSelectedAmbassador(null);
      setIsEditMode(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar embaixador',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Gerenciamento de Embaixadores</Heading>
          <Button colorScheme="blue" onClick={() => {
            setIsEditMode(false);
            setSelectedAmbassador(null);
            onOpen();
          }}>
            Adicionar Embaixador
          </Button>
        </Box>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Data de Criação</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {ambassadors.map((ambassador) => (
              <Tr key={ambassador.id}>
                <Td>{ambassador.name}</Td>
                <Td>{ambassador.email}</Td>
                <Td>{new Date(ambassador.created_at).toLocaleDateString()}</Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    onClick={() => handleEdit(ambassador)}
                  >
                    Editar
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Modal isOpen={isOpen} onClose={() => {
          onClose();
          setSelectedAmbassador(null);
          setIsEditMode(false);
          setFormData({ userId: '', metabaseQuestionId: '' });
        }}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEditMode ? 'Editar Embaixador' : 'Adicionar Embaixador'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <form onSubmit={handleSubmit}>
                <FormControl mb={4}>
                  <FormLabel>Usuário</FormLabel>
                  <Select
                    placeholder="Selecione um usuário"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>ID do Dashboard Metabase</FormLabel>
                  <Input
                    value={formData.metabaseQuestionId}
                    onChange={(e) => setFormData({ ...formData, metabaseQuestionId: e.target.value })}
                    placeholder="Digite o ID do dashboard"
                  />
                </FormControl>
                <Button type="submit" colorScheme="blue" w="full">
                  {isEditMode ? 'Salvar Alterações' : 'Adicionar'}
                </Button>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
} 