import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  useDisclosure,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Heading,
  HStack,
  Select,
  Spinner,
  Badge,
  Card,
  CardBody,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Switch,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { CSStudent, CSFeedbackNote, NewCSStudent, CSUser } from '../types/cs';
import { useAuth } from '../contexts/AuthContext';

export function CSDashboard() {
  const [students, setStudents] = useState<CSStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<CSStudent | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<CSFeedbackNote[]>([]);
  const [newFeedbackNote, setNewFeedbackNote] = useState('');
  const [csUsers, setCSUsers] = useState<CSUser[]>([]);
  const [filters, setFilters] = useState({
    priority: '',
    responsible: '',
    completed: ''
  });
  const [newStudent, setNewStudent] = useState<NewCSStudent>({
    name: '',
    email: '',
    phone: '',
    priority: 'media',
    cs_responsible: undefined
  });
  const [studentToDelete, setStudentToDelete] = useState<CSStudent | null>(null);

  const { isOpen: isCreateStudentOpen, onOpen: onCreateStudentOpen, onClose: onCreateStudentClose } = useDisclosure();
  const { isOpen: isViewNotesOpen, onOpen: onViewNotesOpen, onClose: onViewNotesClose } = useDisclosure();
  const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { appUser } = useAuth();
  const isAdmin = appUser?.role === 'admin';

  useEffect(() => {
    fetchStudents();
    fetchCSUsers();
  }, [searchTerm, filters.priority, filters.responsible, filters.completed]);

  const fetchCSUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('cs_users')
        .select('*')
        .order('full_name');

      if (error) throw error;
      
      // Garantir que só temos usuários CS
      const csUsers = data?.filter(user => user.role === 'cs') || [];
      setCSUsers(csUsers);
    } catch (error: any) {
      console.error('Erro ao carregar usuários CS:', error);
      toast({
        title: 'Erro ao carregar usuários CS',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('cs_students')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.responsible) {
        query = filters.responsible === 'sem_cs' 
          ? query.is('cs_responsible', null)
          : query.eq('cs_responsible', filters.responsible);
      }

      if (filters.completed !== '') {
        query = query.eq('is_completed', filters.completed === 'true');
      }

      const { data: students, error: studentsError } = await query;

      if (studentsError) throw studentsError;

      // Buscar os nomes dos CS responsáveis
      const csResponsibleIds = students
        .map(student => student.cs_responsible)
        .filter(id => id) as string[];

      if (csResponsibleIds.length > 0) {
        const { data: responsibleUsers, error: usersError } = await supabase
          .from('cs_users')
          .select('*')
          .in('id', csResponsibleIds);

        if (usersError) throw usersError;

        const usersMap = new Map(
          responsibleUsers?.map(user => [
            user.id, 
            user.full_name
          ])
        );
        
        const studentsWithResponsible = students.map(student => ({
          ...student,
          responsible_user: student.cs_responsible ? {
            full_name: usersMap.get(student.cs_responsible) || 'Usuário não encontrado'
          } : null
        }));

        setStudents(studentsWithResponsible);
      } else {
        setStudents(students);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar alunos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('cs_students')
        .insert([{
          ...newStudent,
          created_by: appUser?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [data, ...prev]);
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        priority: 'media',
        cs_responsible: undefined
      });
      onCreateStudentClose();

      toast({
        title: 'Aluno criado com sucesso!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao criar aluno:', error);
      toast({
        title: 'Erro ao criar aluno',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleViewNotes = async (student: CSStudent) => {
    setSelectedStudent(student);
    
    try {
      const { data: notes, error } = await supabase
        .from('cs_feedback_notes')
        .select(`
          id,
          note,
          created_at,
          created_by,
          student_id,
          creator:created_by (
            id,
            full_name
          )
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .returns<CSFeedbackNote[]>();

      if (error) throw error;

      setFeedbackNotes(notes);
      onViewNotesOpen();
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error);
      toast({
        title: 'Erro ao carregar feedbacks',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handlePriorityChange = async (studentId: string, priority: string) => {
    try {
      const { data, error } = await supabase
        .from('cs_students')
        .update({ priority })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => prev.map(s => s.id === studentId ? data : s));

      // Adiciona feedback automático
      const feedbackMessage = `🎯 Prioridade alterada para: ${getPriorityLabel(priority)}`;
      await supabase.from('cs_feedback_notes').insert([{
        student_id: studentId,
        note: feedbackMessage,
        created_by: appUser?.id,
      }]);

      toast({
        title: 'Prioridade atualizada com sucesso!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast({
        title: 'Erro ao atualizar prioridade',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleToggleCompleted = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    try {
      const { data: updatedStudent, error: updateError } = await supabase
        .from('cs_students')
        .update({ is_completed: !student.is_completed })
        .eq('id', studentId)
        .select()
        .single();

      if (updateError) throw updateError;

      setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

      // Cria um feedback automático
      const feedbackMessage = !student.is_completed 
        ? "✅ Atendimento finalizado" 
        : "🔄 Atendimento reaberto";

      const { error: feedbackError } = await supabase
        .from('cs_feedback_notes')
        .insert([{
          student_id: studentId,
          note: feedbackMessage,
          created_by: appUser?.id,
        }]);

      if (feedbackError) throw feedbackError;

      toast({
        title: `Atendimento ${!student.is_completed ? 'finalizado' : 'reaberto'}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'red';
      case 'media':
        return 'orange';
      case 'baixa':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const handleChangeResponsible = async (studentId: string, csResponsible: string | null) => {
    try {
      const { data, error } = await supabase
        .from('cs_students')
        .update({ cs_responsible: csResponsible })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      // Se não houver CS responsável, atualiza sem buscar o nome
      if (!csResponsible) {
        const updatedStudent = {
          ...data,
          responsible_user: null
        };
        setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

        // Adiciona feedback automático
        await supabase.from('cs_feedback_notes').insert([{
          student_id: studentId,
          note: "👤 CS Responsável removido",
          created_by: appUser?.id,
        }]);

        return;
      }

      // Busca o nome do CS responsável
      const { data: userData, error: userError } = await supabase
        .from('cs_users')
        .select('*')
        .eq('id', csResponsible)
        .single();

      if (userError) throw userError;

      const updatedStudent = {
        ...data,
        responsible_user: userData
      };

      setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));

      // Adiciona feedback automático
      const feedbackMessage = `👤 CS Responsável alterado para ${userData.full_name}`;
      await supabase.from('cs_feedback_notes').insert([{
        student_id: studentId,
        note: feedbackMessage,
        created_by: appUser?.id,
      }]);

      toast({
        title: 'CS Responsável atualizado com sucesso!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao atualizar CS responsável:', error);
      toast({
        title: 'Erro ao atualizar CS responsável',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleAddNote = async () => {
    if (!selectedStudent || !newFeedbackNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('cs_feedback_notes')
        .insert([{
          student_id: selectedStudent.id,
          note: newFeedbackNote,
          created_by: appUser?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setFeedbackNotes(prev => [data, ...prev]);
      setNewFeedbackNote('');
      
      toast({
        title: 'Feedback adicionado com sucesso!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao adicionar feedback:', error);
      toast({
        title: 'Erro ao adicionar feedback',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      console.log('Iniciando exclusão do aluno:', studentToDelete.id);

      // Primeiro, deleta todos os feedbacks do aluno
      console.log('Deletando feedbacks...');
      const { error: feedbackError } = await supabase
        .rpc('delete_student_feedbacks', { p_student_id: studentToDelete.id });

      if (feedbackError) {
        console.error('Erro ao deletar feedbacks:', feedbackError);
        throw feedbackError;
      }
      console.log('Feedbacks deletados com sucesso');

      // Depois, deleta o aluno
      console.log('Deletando aluno...');
      const { error: studentError } = await supabase
        .rpc('delete_student', { p_student_id: studentToDelete.id });

      if (studentError) {
        console.error('Erro ao deletar aluno:', studentError);
        throw studentError;
      }
      console.log('Aluno deletado com sucesso');

      // Atualiza o estado local
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      onDeleteDialogClose();
      setStudentToDelete(null);

      toast({
        title: 'Aluno removido com sucesso!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: 'Erro ao remover aluno',
        description: 'Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Card mb={4} variant="outline" borderRadius="lg">
        <CardBody>
          <Stack spacing={4}>
            <HStack justify="space-between" align="center">
              <Box>
                <Heading size="lg" mb={1}>Painel CS</Heading>
                <Text color="gray.500">Gerencie os feedbacks de alunos</Text>
              </Box>
              <Button 
                leftIcon={<AddIcon />} 
                onClick={onCreateStudentOpen}
                bg="#FFDB01"
                color="black"
                _hover={{ bg: '#E5C501' }}
              >
                Novo Aluno
              </Button>
            </HStack>

            <Stack spacing={4}>
              <HStack spacing={4}>
                <Input
                  placeholder="Buscar alunos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxW="400px"
                />
              </HStack>

              <HStack spacing={4}>
                <Select
                  placeholder="Filtrar por Prioridade"
                  value={filters.priority}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, priority: e.target.value }));
                    fetchStudents();
                  }}
                  maxW="200px"
                >
                  <option value="">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </Select>

                <Select
                  placeholder="Filtrar por CS"
                  value={filters.responsible}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, responsible: e.target.value }));
                    fetchStudents();
                  }}
                  maxW="200px"
                >
                  <option value="">Todos</option>
                  <option value="sem_cs">Sem CS</option>
                  {csUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </Select>

                <Select
                  placeholder="Status"
                  value={filters.completed}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, completed: e.target.value }));
                    fetchStudents();
                  }}
                  maxW="200px"
                >
                  <option value="">Todos</option>
                  <option value="true">Finalizado</option>
                  <option value="false">Em Andamento</option>
                </Select>
              </HStack>
            </Stack>
          </Stack>
        </CardBody>
      </Card>

      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="#FFDB01" />
        </Box>
      ) : students.length === 0 ? (
        <Card variant="outline" borderRadius="lg">
          <CardBody>
            <Text textAlign="center" color="gray.500">
              {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </Text>
          </CardBody>
        </Card>
      ) : (
        <Card variant="outline" borderRadius="lg">
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Telefone</Th>
                  <Th>Prioridade</Th>
                  <Th>CS Responsável</Th>
                  <Th>Data de Cadastro</Th>
                  <Th>Finalizado</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.map((student) => (
                  <Tr 
                    key={student.id}
                    bg={student.is_completed ? 'green.100' : undefined}
                    _hover={{
                      bg: student.is_completed ? 'green.200' : 'gray.50'
                    }}
                  >
                    <Td>{student.name}</Td>
                    <Td>{student.email}</Td>
                    <Td>{student.phone}</Td>
                    <Td>
                      <Menu>
                        <MenuButton as={Button} size="sm" variant="ghost" p={1}>
                          <Badge
                            colorScheme={getPriorityColor(student.priority)}
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {getPriorityLabel(student.priority)}
                          </Badge>
                        </MenuButton>
                        <MenuList minW="110px">
                          <MenuItem onClick={() => handlePriorityChange(student.id, 'baixa')}>
                            <Badge colorScheme="green" mr={2}>Baixa</Badge>
                          </MenuItem>
                          <MenuItem onClick={() => handlePriorityChange(student.id, 'media')}>
                            <Badge colorScheme="orange" mr={2}>Média</Badge>
                          </MenuItem>
                          <MenuItem onClick={() => handlePriorityChange(student.id, 'alta')}>
                            <Badge colorScheme="red" mr={2}>Alta</Badge>
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton as={Button} size="sm" variant="ghost" p={1}>
                          <Badge
                            colorScheme="purple"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            {student.responsible_user?.full_name || 'Sem CS'}
                          </Badge>
                        </MenuButton>
                        <MenuList minW="200px">
                          <MenuItem onClick={() => handleChangeResponsible(student.id, null)}>
                            <Badge colorScheme="gray" mr={2}>Sem CS</Badge>
                          </MenuItem>
                          {csUsers.map((user) => (
                            <MenuItem 
                              key={user.id} 
                              onClick={() => handleChangeResponsible(student.id, user.id)}
                            >
                              <Badge colorScheme="purple" mr={2}>{user.full_name}</Badge>
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>
                    </Td>
                    <Td>{new Date(student.created_at).toLocaleDateString()}</Td>
                    <Td>
                      <Switch
                        isChecked={student.is_completed}
                        onChange={() => handleToggleCompleted(student.id)}
                        colorScheme="green"
                      />
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="purple"
                          variant="outline"
                          onClick={() => handleViewNotes(student)}
                        >
                          Ver Feedbacks
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              setStudentToDelete(student);
                              onDeleteDialogOpen();
                            }}
                          >
                            <DeleteIcon />
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Modal de Criar Aluno */}
      <Modal isOpen={isCreateStudentOpen} onClose={onCreateStudentClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Aluno</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Telefone</FormLabel>
                <Input
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Prioridade</FormLabel>
                <Select
                  value={newStudent.priority}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, priority: e.target.value as 'baixa' | 'media' | 'alta' }))}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>CS Responsável</FormLabel>
                <Menu>
                  <MenuButton as={Button} width="100%" variant="outline">
                    <Badge
                      colorScheme="purple"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {newStudent.cs_responsible ? 
                        csUsers.find(u => u.id === newStudent.cs_responsible)?.full_name || 'Sem CS' 
                        : 'Selecionar CS'}
                    </Badge>
                  </MenuButton>
                  <MenuList minW="200px">
                    <MenuItem onClick={() => setNewStudent(prev => ({ ...prev, cs_responsible: undefined }))}>
                      <Badge colorScheme="gray" mr={2}>Sem CS</Badge>
                    </MenuItem>
                    {csUsers.map(user => (
                      <MenuItem key={user.id} onClick={() => setNewStudent(prev => ({ ...prev, cs_responsible: user.id }))}>
                        <Badge colorScheme="purple" mr={2}>{user.full_name}</Badge>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </FormControl>
              <Button 
                width="100%" 
                onClick={handleCreateStudent}
                bg="#FFDB01"
                color="black"
                _hover={{ bg: '#E5C501' }}
              >
                Cadastrar
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Ver Feedbacks */}
      <Modal isOpen={isViewNotesOpen} onClose={onViewNotesClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <Box position="relative" p={6}>
            <Flex justify="space-between" align="center" mb={6} pr={8}>
              <Text fontSize="lg" fontWeight="bold">Feedbacks - {selectedStudent?.name}</Text>
            </Flex>
            <ModalCloseButton />
            <Box>
              <VStack spacing={4} align="stretch" mb={6}>
                <FormControl>
                  <FormLabel>Novo Feedback</FormLabel>
                  <Textarea
                    value={newFeedbackNote}
                    onChange={(e) => setNewFeedbackNote(e.target.value)}
                    placeholder="Digite seu feedback aqui..."
                    size="sm"
                    rows={3}
                  />
                </FormControl>
                <Button
                  leftIcon={<AddIcon />}
                  onClick={handleAddNote}
                  bg="#FFDB01"
                  color="black"
                  _hover={{ bg: '#E5C501' }}
                  isDisabled={!newFeedbackNote.trim()}
                >
                  Adicionar Feedback
                </Button>
              </VStack>

              {feedbackNotes.length === 0 ? (
                <Text color="gray.500" textAlign="center">Nenhum feedback registrado.</Text>
              ) : (
                <VStack spacing={4} align="stretch" maxH="60vh" overflowY="auto">
                  {feedbackNotes.map((note) => (
                    <Card key={note.id} variant="outline">
                      <CardBody>
                        <Text>{note.note}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(note.created_at).toLocaleString()} por{' '}
                          {note.creator?.full_name || 'Usuário não encontrado'}
                        </Text>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação de Deleção */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Remover Aluno
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja remover o aluno {studentToDelete?.name}? Esta ação não pode ser desfeita e todos os feedbacks serão removidos.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                Cancelar
              </Button>
              <Button colorScheme='red' onClick={handleDeleteStudent} ml={3}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 