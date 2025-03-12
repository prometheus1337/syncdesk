import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Text,
  Stack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { CalendarIcon, AddIcon, SearchIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EssayStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  total_credits: number;
  total_spent: number;
  last_purchase: string;
  last_credit_update: string;
  last_credit_removed: string;
}

interface CreditLog {
  id: string;
  student_id: string;
  student_email: string;
  student_name?: string;
  credits_change: number;
  operation_type: 'add' | 'remove';
  motive?: string;
  created_at: string;
  created_by: string;
  price_paid?: number;
  payment_method?: string;
  payment_id?: string;
  invoice_url?: string;
  status?: string;
}

interface Filter {
  startDate: string;
  endDate: string;
}

interface NewPurchase {
  student_name: string;
  student_email: string;
  student_phone: string;
  credits_amount: number;
  price_paid: number;
}

export function EssayDashboard() {
  const [students, setStudents] = useState<EssayStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<EssayStudent | null>(null);
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>({
    startDate: '',
    endDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [newPurchase, setNewPurchase] = useState<NewPurchase>({
    student_name: '',
    student_email: '',
    student_phone: '',
    credits_amount: 0,
    price_paid: 0,
  });
  
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, [filter]);

  async function fetchStudents() {
    setIsLoading(true);
    
    try {
      // Busca todos os alunos com seus logs
      const { data: studentsData, error: studentsError } = await supabase
        .from('essay_students')
        .select(`
          *,
          essay_credit_logs (
            credits_change,
            operation_type,
            created_at,
            price_paid
          )
        `)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Processa os dados dos alunos
      const processedStudents = studentsData.map(student => {
        const logs = student.essay_credit_logs || [];
        let total_credits = 0;
        let total_spent = 0;
        let last_purchase = student.created_at;

        logs.forEach((log: any) => {
          // Calcula total de créditos
          total_credits += log.operation_type === 'add' ? 
            log.credits_change : -log.credits_change;

          // Atualiza total gasto e última compra
          if (log.price_paid) {
            total_spent += log.price_paid;
            if (new Date(log.created_at) > new Date(last_purchase)) {
              last_purchase = log.created_at;
            }
          }
        });

        return {
          ...student,
          total_credits,
          total_spent,
          last_purchase,
        };
      });

      setStudents(processedStudents);
    } catch (error: any) {
      toast({
        title: 'Erro ao buscar dados',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStudentLogs(studentId: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('essay_credit_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao buscar logs',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      setCreditLogs(data);
    }
    setIsLoading(false);
  }

  function handleViewStudent(student: EssayStudent) {
    setSelectedStudent(student);
    fetchStudentLogs(student.id);
    onViewOpen();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function handleApplyDateFilter() {
    fetchStudents();
    onFilterClose();
  }

  function handleClearDateFilter() {
    setFilter({
      startDate: '',
      endDate: ''
    });
    onFilterClose();
  }

  async function handleCreatePurchase() {
    setIsLoading(true);
    
    try {
      // Primeiro, verifica se o aluno existe
      const { data: existingStudent, error: checkError } = await supabase
        .from('essay_students')
        .select('id')
        .eq('email', newPurchase.student_email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
        throw checkError;
      }

      // Se o aluno não existe, cria ele
      if (!existingStudent) {
        const { error: createError } = await supabase
          .from('essay_students')
          .insert([{
            email: newPurchase.student_email,
            name: newPurchase.student_name,
            phone: newPurchase.student_phone,
            created_at: new Date().toISOString(),
            last_credit_update: new Date().toISOString()
          }]);

        if (createError) throw createError;
      }

      // Insere o log de crédito
      const { error: logError } = await supabase
        .from('essay_credit_logs')
        .insert([{
          student_name: newPurchase.student_name,
          student_email: newPurchase.student_email,
          credits_change: newPurchase.credits_amount,
          operation_type: 'add',
          motive: 'purchase',
          created_by: appUser?.email || 'API',
          price_paid: newPurchase.price_paid,
          payment_method: 'Não especificado',
          status: 'completed',
        }]);

      if (logError) throw logError;

      // Atualiza a data do último crédito
      const { error: updateError } = await supabase
        .from('essay_students')
        .update({ last_credit_update: new Date().toISOString() })
        .eq('email', newPurchase.student_email);

      if (updateError) throw updateError;

      toast({
        title: 'Compra registrada com sucesso',
        status: 'success',
        duration: 2000,
      });

      setNewPurchase({
        student_name: '',
        student_email: '',
        student_phone: '',
        credits_amount: 0,
        price_paid: 0,
      });
      onCreateClose();
      fetchStudents();

    } catch (error: any) {
      toast({
        title: 'Erro ao processar compra',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    return (
      newPurchase.student_name.trim() !== '' &&
      newPurchase.student_email.trim() !== '' &&
      newPurchase.credits_amount > 0 &&
      newPurchase.price_paid > 0
    );
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  if (!appUser || !['admin', 'essay_director'].includes(appUser.role)) {
    return (
      <Card>
        <CardBody>
          <Text>Você não tem permissão para acessar esta página.</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card width="100%" maxW="1600px" mx="auto" variant="outline">
      <CardHeader>
        <Stack spacing={4}>
          <Flex justifyContent="space-between" alignItems="center">
            <Box>
              <Heading size="md">Controle de Redações</Heading>
              <Text color="gray.500" mt={1}>
                Gerencie os alunos e créditos de redação
              </Text>
            </Box>
            <Button
              leftIcon={<AddIcon />}
              bg="#FFDB01"
              color="black"
              _hover={{ bg: "#e5c501" }}
              onClick={onCreateOpen}
              size="sm"
            >
              Nova Compra
            </Button>
          </Flex>

          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Buscar por nome ou email do aluno"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Button
              leftIcon={<CalendarIcon />}
              onClick={onFilterOpen}
              size="md"
              variant="outline"
              w="100%"
            >
              {filter.startDate || filter.endDate ? (
                `${filter.startDate ? formatDate(filter.startDate) : 'Início'} até ${filter.endDate ? formatDate(filter.endDate) : 'Fim'}`
              ) : (
                'Filtrar por Data'
              )}
            </Button>
          </Grid>
        </Stack>
      </CardHeader>

      <CardBody>
        {isLoading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="#FFDB01" />
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data de Criação</Th>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Créditos</Th>
                  <Th>Total Investido</Th>
                  <Th>Última Atualização</Th>
                  <Th>Última Redução</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStudents.map((student) => (
                  <Tr key={student.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }}>
                    <Td>{formatDate(student.last_purchase)}</Td>
                    <Td>{student.name}</Td>
                    <Td>{student.email}</Td>
                    <Td>{student.total_credits}</Td>
                    <Td>{formatCurrency(student.total_spent)}</Td>
                    <Td>{student.last_credit_update ? formatDate(student.last_credit_update) : '-'}</Td>
                    <Td>{student.last_credit_removed ? formatDate(student.last_credit_removed) : '-'}</Td>
                    <Td>
                      <Button
                        size="sm"
                        bg="#FFDB01"
                        color="black"
                        _hover={{ bg: "#e5c501" }}
                        onClick={() => handleViewStudent(student)}
                      >
                        Ver detalhes
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {filteredStudents.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  Nenhum aluno encontrado
                </Text>
              </Box>
            )}
          </Box>
        )}
      </CardBody>

      {/* Modal de visualização do aluno */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Aluno</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedStudent && (
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold">Nome:</Text>
                  <Text>{selectedStudent.name}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Email:</Text>
                  <Text>{selectedStudent.email}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Total de Créditos:</Text>
                  <Text>{selectedStudent.total_credits}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Total Investido:</Text>
                  <Text>{formatCurrency(selectedStudent.total_spent)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>Histórico de Operações:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Data</Th>
                        <Th>Tipo</Th>
                        <Th>Créditos</Th>
                        <Th>Valor</Th>
                        <Th>Motivo</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {creditLogs.map((log) => (
                        <Tr key={log.id}>
                          <Td>{formatDate(log.created_at)}</Td>
                          <Td>
                            <Text color={log.operation_type === 'add' ? 'green.500' : 'red.500'}>
                              {log.operation_type === 'add' ? 'Adição' : 'Redução'}
                            </Text>
                          </Td>
                          <Td>{log.credits_change}</Td>
                          <Td>{log.price_paid ? formatCurrency(log.price_paid) : '-'}</Td>
                          <Td>{log.motive || '-'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              bg="#FFDB01"
              color="black"
              _hover={{ bg: "#e5c501" }}
              onClick={onViewClose}
            >
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de filtro de data */}
      <Modal isOpen={isFilterOpen} onClose={onFilterClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Filtrar por Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>Data Inicial:</Text>
                <Input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                />
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>Data Final:</Text>
                <Input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                />
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleClearDateFilter}
              bg="gray.100"
              color="black"
              _hover={{ bg: "gray.200" }}
            >
              Limpar
            </Button>
            <Button
              bg="#FFDB01"
              color="black"
              _hover={{ bg: "#e5c501" }}
              onClick={handleApplyDateFilter}
            >
              Aplicar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de criação de compra */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registrar Nova Compra</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome do Aluno</FormLabel>
                <Input
                  value={newPurchase.student_name}
                  onChange={(e) => setNewPurchase({ ...newPurchase, student_name: e.target.value })}
                  placeholder="Nome completo do aluno"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email do Aluno</FormLabel>
                <Input
                  type="email"
                  value={newPurchase.student_email}
                  onChange={(e) => setNewPurchase({ ...newPurchase, student_email: e.target.value })}
                  placeholder="Email do aluno"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Telefone do Aluno</FormLabel>
                <Input
                  value={newPurchase.student_phone}
                  onChange={(e) => setNewPurchase({ ...newPurchase, student_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Quantidade de Créditos</FormLabel>
                <Input
                  type="number"
                  value={newPurchase.credits_amount}
                  onChange={(e) => setNewPurchase({ ...newPurchase, credits_amount: parseInt(e.target.value) })}
                  placeholder="Quantidade de créditos"
                  min={1}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Valor Pago</FormLabel>
                <Input
                  type="number"
                  value={newPurchase.price_paid}
                  onChange={(e) => setNewPurchase({ ...newPurchase, price_paid: parseFloat(e.target.value) })}
                  placeholder="Valor pago pelo pacote"
                  min={0}
                  step={0.01}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onCreateClose}
              bg="gray.100"
              color="black"
              _hover={{ bg: "gray.200" }}
            >
              Cancelar
            </Button>
            <Button
              bg="#FFDB01"
              color="black"
              _hover={{ bg: "#e5c501" }}
              onClick={handleCreatePurchase}
              isLoading={isLoading}
              isDisabled={!validateForm()}
            >
              Registrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
} 