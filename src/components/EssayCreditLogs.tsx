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
  Textarea,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
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
      .select('*')
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
        created_by: appUser?.email,
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
      newLog.credits_amount > 0
    );
  }

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.student_email.toLowerCase().includes(searchLower) ||
      (log.motive || '').toLowerCase().includes(searchLower)
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
                <Select
                  value={newLog.student_email}
                  onChange={(e) => setNewLog({ ...newLog, student_email: e.target.value })}
                  placeholder="Selecione um aluno"
                >
                  {students.map((student) => (
                    <option key={student.email} value={student.email}>
                      {student.name} ({student.email}) - {student.total_credits} créditos
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Tipo de Operação</FormLabel>
                <Select
                  value={newLog.operation_type}
                  onChange={(e) => setNewLog({ ...newLog, operation_type: e.target.value as 'add' | 'remove' })}
                >
                  <option value="add">Adicionar Créditos</option>
                  <option value="remove">Remover Créditos</option>
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
              <FormControl>
                <FormLabel>Motivo (opcional)</FormLabel>
                <Textarea
                  value={newLog.motive}
                  onChange={(e) => setNewLog({ ...newLog, motive: e.target.value })}
                  placeholder="Descreva o motivo da operação"
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