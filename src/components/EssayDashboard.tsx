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
  total_credits: number;
  total_spent: number;
  last_purchase: string;
}

interface EssayPurchase {
  id: string;
  student_name: string;
  student_email: string;
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
  student_name: string;
  student_email: string;
  credits_amount: number;
  price_paid: number;
  created_at: string;
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
  const [purchases, setPurchases] = useState<EssayPurchase[]>([]);
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
    let query = `
      student_id,
      student_name,
      student_email,
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

    // Agrupa as compras por aluno (usando email como chave)
    const studentsMap = new Map<string, EssayStudent>();
    
    (data as PurchaseQueryResult[] | null)?.forEach(purchase => {
      const student = studentsMap.get(purchase.student_email);
      if (student) {
        student.total_credits += purchase.credits_amount;
        student.total_spent += purchase.price_paid;
        // Atualiza last_purchase apenas se for mais recente
        if (new Date(purchase.created_at) > new Date(student.last_purchase)) {
          student.last_purchase = purchase.created_at;
        }
      } else {
        studentsMap.set(purchase.student_email, {
          id: purchase.student_id,
          name: purchase.student_name,
          email: purchase.student_email,
          phone: '',
          total_credits: purchase.credits_amount,
          total_spent: purchase.price_paid,
          last_purchase: purchase.created_at,
        });
      }
    });

    setStudents(Array.from(studentsMap.values()));
    setIsLoading(false);
  }

  async function fetchStudentPurchases(studentEmail: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('essay_purchases')
      .select('*')
      .eq('student_email', studentEmail)
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
    fetchStudentPurchases(student.email);
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
    
    const { error } = await supabase
      .from('essay_purchases')
      .insert([{
        student_name: newPurchase.student_name,
        student_email: newPurchase.student_email,
        student_phone: newPurchase.student_phone,
        credits_amount: newPurchase.credits_amount,
        price_paid: newPurchase.price_paid,
        payment_method: 'Não especificado',
        status: 'completed',
      }]);

    if (error) {
      toast({
        title: 'Erro ao registrar compra',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
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
    }
    
    setIsLoading(false);
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
                  <Th>Telefone</Th>
                  <Th>Créditos</Th>
                  <Th>Total Investido</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStudents.map((student) => (
                  <Tr key={student.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }}>
                    <Td>{formatDate(student.last_purchase)}</Td>
                    <Td>{student.name}</Td>
                    <Td>{student.email}</Td>
                    <Td>{student.phone || '-'}</Td>
                    <Td>{student.total_credits}</Td>
                    <Td>{formatCurrency(student.total_spent)}</Td>
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