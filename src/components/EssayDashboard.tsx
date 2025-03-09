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
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { CalendarIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EssayStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_credits: number;
  total_spent: number;
  last_purchase: string;
}

interface EssayPurchase {
  id: string;
  credits_amount: number;
  price_paid: number;
  payment_method: string;
  created_at: string;
  status: string;
  payment_id: string;
  invoice_url: string;
}

interface Filter {
  startDate: string;
  endDate: string;
}

interface PurchaseQueryResult {
  student_id: string;
  name: {
    name: string;
    email: string;
    phone: string;
  };
  credits_amount: number;
  price_paid: number;
  created_at: string;
}

interface NewStudent {
  name: string;
  email: string;
  phone: string;
  credits_amount: number;
  price_paid: number;
}

export function EssayDashboard() {
  const [students, setStudents] = useState<EssayStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<EssayStudent | null>(null);
  const [purchases, setPurchases] = useState<EssayPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>({
    startDate: '',
    endDate: '',
  });
  const [newStudent, setNewStudent] = useState<NewStudent>({
    name: '',
    email: '',
    phone: '',
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
    let query = `
      student_id,
      name:essay_students(name, email, phone),
      credits_amount,
      price_paid,
      created_at
    `;

    let { data, error } = await supabase
      .from('essay_purchases')
      .select(query)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao buscar alunos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // Agrupa as compras por aluno
    const studentsMap = new Map<string, EssayStudent>();
    
    (data as PurchaseQueryResult[] | null)?.forEach(purchase => {
      const student = studentsMap.get(purchase.student_id);
      if (student) {
        student.total_credits += purchase.credits_amount;
        student.total_spent += purchase.price_paid;
        // Atualiza last_purchase apenas se for mais recente
        if (new Date(purchase.created_at) > new Date(student.last_purchase)) {
          student.last_purchase = purchase.created_at;
        }
      } else {
        studentsMap.set(purchase.student_id, {
          id: purchase.student_id,
          name: purchase.name.name,
          email: purchase.name.email,
          phone: purchase.name.phone,
          total_credits: purchase.credits_amount,
          total_spent: purchase.price_paid,
          last_purchase: purchase.created_at,
        });
      }
    });

    setStudents(Array.from(studentsMap.values()));
    setIsLoading(false);
  }

  async function fetchStudentPurchases(studentId: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('essay_purchases')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao buscar compras',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      setPurchases(data);
    }
    setIsLoading(false);
  }

  function handleViewStudent(student: EssayStudent) {
    setSelectedStudent(student);
    fetchStudentPurchases(student.id);
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

  async function handleCreateStudent() {
    setIsLoading(true);
    
    // Primeiro, criar o aluno
    const { data: studentData, error: studentError } = await supabase
      .from('essay_students')
      .insert([{
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
      }])
      .select()
      .single();

    if (studentError) {
      toast({
        title: 'Erro ao criar aluno',
        description: studentError.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    // Depois, registrar a compra inicial
    const { error: purchaseError } = await supabase
      .from('essay_purchases')
      .insert([{
        student_id: studentData.id,
        credits_amount: newStudent.credits_amount,
        price_paid: newStudent.price_paid,
        payment_method: 'Não especificado',
        status: 'completed',
      }]);

    if (purchaseError) {
      toast({
        title: 'Erro ao registrar compra',
        description: purchaseError.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Aluno cadastrado com sucesso',
        status: 'success',
        duration: 2000,
      });
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        credits_amount: 0,
        price_paid: 0,
      });
      onCreateClose();
      fetchStudents();
    }
    
    setIsLoading(false);
  }

  function validateForm() {
    return (
      newStudent.name.trim() !== '' &&
      newStudent.email.trim() !== '' &&
      newStudent.credits_amount > 0 &&
      newStudent.price_paid > 0
    );
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
              Adicionar Aluno
            </Button>
          </Flex>

          <Grid templateColumns="repeat(1, 1fr)" gap={4}>
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
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {students.map((student) => (
                <Card key={student.id} variant="outline" cursor="pointer" onClick={() => handleViewStudent(student)}>
                  <CardBody>
                    <Stack spacing={3}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Text fontWeight="bold">{student.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(student.last_purchase)}
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color="gray.600">{student.email}</Text>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Text>Créditos: {student.total_credits}</Text>
                        <Text>Total: {formatCurrency(student.total_spent)}</Text>
                      </Flex>
                      <Button
                        size="sm"
                        variant="ghost"
                        bg="#FFDB01"
                        color="black"
                        _hover={{ bg: "#e5c501" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStudent(student);
                        }}
                      >
                        Ver detalhes
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            {students.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  Nenhum aluno encontrado
                </Text>
              </Box>
            )}
          </>
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
                  <Text fontWeight="bold">Telefone:</Text>
                  <Text>{selectedStudent.phone || 'Não informado'}</Text>
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
                  <Text fontWeight="bold" mb={2}>Histórico de Compras:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Data</Th>
                        <Th>Créditos</Th>
                        <Th>Valor</Th>
                        <Th>Método</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {purchases.map((purchase) => (
                        <Tr key={purchase.id}>
                          <Td>{formatDate(purchase.created_at)}</Td>
                          <Td>{purchase.credits_amount}</Td>
                          <Td>{formatCurrency(purchase.price_paid)}</Td>
                          <Td>{purchase.payment_method}</Td>
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

      {/* Modal de criação de aluno */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Novo Aluno</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="Nome completo do aluno"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="Email do aluno"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Telefone</FormLabel>
                <Input
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Quantidade de Créditos</FormLabel>
                <Input
                  type="number"
                  value={newStudent.credits_amount}
                  onChange={(e) => setNewStudent({ ...newStudent, credits_amount: parseInt(e.target.value) })}
                  placeholder="Quantidade de créditos"
                  min={1}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Valor Pago</FormLabel>
                <Input
                  type="number"
                  value={newStudent.price_paid}
                  onChange={(e) => setNewStudent({ ...newStudent, price_paid: parseFloat(e.target.value) })}
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
              onClick={handleCreateStudent}
              isLoading={isLoading}
              isDisabled={!validateForm()}
            >
              Cadastrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
} 