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
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreditLog {
  id: string;
  student_email: string;
  credits_amount: number;
  operation_type: 'add' | 'remove';
  motive?: string;
  created_at: string;
  created_by: string;
}

interface Student {
  email: string;
  name: string;
  total_credits: number;
}

interface NewCreditLog {
  student_email: string;
  credits_amount: number;
  operation_type: 'add' | 'remove';
  motive?: string;
}

const CREDIT_MOTIVES = {
  add: [
    { value: 'bonus', label: 'Bônus' },
    { value: 'refund', label: 'Devolução de crédito' }
  ],
  remove: [
    { value: 'expired', label: 'Crédito expirado' },
    { value: 'essay_sent', label: 'Redação enviada' }
  ]
};

export function EssayCreditLogs() {
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLog, setNewLog] = useState<NewCreditLog>({
    student_email: '',
    credits_amount: 0,
    operation_type: 'add',
    motive: '',
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    fetchLogs();
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setIsLoading(true);
    
    // Primeiro, busca todas as compras
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('essay_purchases')
      .select('student_email, student_name, credits_amount');

    if (purchaseError) {
      toast({
        title: 'Erro ao buscar alunos',
        description: purchaseError.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // Depois, busca todos os logs de créditos
    const { data: logsData, error: logsError } = await supabase
      .from('essay_credit_logs')
      .select('student_email, credits_amount, operation_type');

    if (logsError) {
      toast({
        title: 'Erro ao buscar logs',
        description: logsError.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // Agrupa os dados por email do aluno
    const studentMap = new Map<string, Student>();

    // Processa as compras
    purchaseData?.forEach(purchase => {
      const student = studentMap.get(purchase.student_email) || {
        email: purchase.student_email,
        name: purchase.student_name,
        total_credits: 0,
      };
      student.total_credits += purchase.credits_amount;
      studentMap.set(purchase.student_email, student);
    });

    // Processa os logs
    logsData?.forEach(log => {
      const student = studentMap.get(log.student_email);
      if (student) {
        student.total_credits += log.operation_type === 'add' ? 
          log.credits_amount : -log.credits_amount;
        studentMap.set(log.student_email, student);
      }
    });

    setStudents(Array.from(studentMap.values()));
    setIsLoading(false);
  }

  async function fetchLogs() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('essay_credit_logs')
      .select(`
        id,
        student_email,
        credits_amount,
        operation_type,
        motive,
        created_at,
        created_by
      `)
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
      setLogs(data);
    }
    setIsLoading(false);
  }

  async function handleCreateLog() {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('essay_credit_logs')
      .insert([{
        student_email: newLog.student_email,
        credits_amount: newLog.credits_amount,
        operation_type: newLog.operation_type,
        motive: newLog.motive || null,
        created_by: appUser?.id || '',
      }]);

    if (error) {
      toast({
        title: 'Erro ao registrar operação',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Operação registrada com sucesso',
        status: 'success',
        duration: 2000,
      });
      setNewLog({
        student_email: '',
        credits_amount: 0,
        operation_type: 'add',
        motive: '',
      });
      onCreateClose();
      fetchLogs();
      fetchStudents();
    }
    
    setIsLoading(false);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function validateForm() {
    return (
      newLog.student_email.trim() !== '' &&
      newLog.credits_amount > 0 &&
      newLog.motive?.trim() !== ''
    );
  }

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.student_email.toLowerCase().includes(searchLower) ||
      (log.motive || '').toLowerCase().includes(searchLower)
    );
  });

  const filteredStudents = students.filter(student => {
    const searchLower = studentSearch.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  function handleSelectStudent(student: Student) {
    setSelectedStudent(student);
    setNewLog(prev => ({ ...prev, student_email: student.email }));
    setShowStudentList(false);
  }

  function handleOperationTypeChange(value: 'add' | 'remove') {
    setNewLog(prev => ({ 
      ...prev, 
      operation_type: value,
      motive: '' // Limpa o motivo quando muda o tipo de operação
    }));
  }

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
              <Heading size="md">Logs de Créditos</Heading>
              <Text color="gray.500" mt={1}>
                Gerencie as operações de créditos de redação
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
              Nova Operação
            </Button>
          </Flex>

          <Input
            placeholder="Buscar por email do aluno ou motivo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  <Th>Data</Th>
                  <Th>Email do Aluno</Th>
                  <Th>Operação</Th>
                  <Th>Quantidade</Th>
                  <Th>Motivo</Th>
                  <Th>Registrado por</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredLogs.map((log) => (
                  <Tr key={log.id}>
                    <Td>{formatDate(log.created_at)}</Td>
                    <Td>{log.student_email}</Td>
                    <Td>
                      <Text color={log.operation_type === 'add' ? 'green.500' : 'red.500'}>
                        {log.operation_type === 'add' ? 'Adição' : 'Redução'}
                      </Text>
                    </Td>
                    <Td>{log.credits_amount}</Td>
                    <Td>{log.motive || '-'}</Td>
                    <Td>{log.created_by}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {filteredLogs.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  Nenhum log encontrado
                </Text>
              </Box>
            )}
          </Box>
        )}
      </CardBody>

      {/* Modal de nova operação */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nova Operação de Créditos</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Aluno</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setShowStudentList(true);
                      }}
                      placeholder="Buscar aluno por nome ou email"
                      onClick={() => setShowStudentList(true)}
                    />
                  </InputGroup>
                  {selectedStudent && (
                    <Box p={2} bg="gray.50" borderRadius="md">
                      <Text fontWeight="bold">{selectedStudent.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedStudent.email} - {selectedStudent.total_credits} créditos
                      </Text>
                    </Box>
                  )}
                  {showStudentList && studentSearch && (
                    <Box
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                      position="relative"
                      bg="white"
                      zIndex={1}
                      boxShadow="sm"
                    >
                      <List spacing={0}>
                        {filteredStudents.map((student) => (
                          <ListItem
                            key={student.email}
                            p={2}
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            onClick={() => handleSelectStudent(student)}
                          >
                            <Text fontWeight="bold">{student.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {student.email} - {student.total_credits} créditos
                            </Text>
                          </ListItem>
                        ))}
                        {filteredStudents.length === 0 && (
                          <ListItem p={2}>
                            <Text color="gray.500">Nenhum aluno encontrado</Text>
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                </VStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo de Operação</FormLabel>
                <Select
                  value={newLog.operation_type}
                  onChange={(e) => handleOperationTypeChange(e.target.value as 'add' | 'remove')}
                >
                  <option value="remove">Remover Créditos</option>
                  <option value="add">Adicionar Créditos</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Quantidade de Créditos</FormLabel>
                <Input
                  type="number"
                  value={newLog.credits_amount}
                  onChange={(e) => setNewLog({ ...newLog, credits_amount: parseInt(e.target.value) })}
                  min={1}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Motivo</FormLabel>
                <Select
                  value={newLog.motive || ''}
                  onChange={(e) => setNewLog({ ...newLog, motive: e.target.value })}
                  placeholder="Selecione um motivo"
                >
                  {CREDIT_MOTIVES[newLog.operation_type].map(motive => (
                    <option key={motive.value} value={motive.value}>
                      {motive.label}
                    </option>
                  ))}
                </Select>
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
              onClick={handleCreateLog}
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