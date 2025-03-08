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
  Textarea,
  useToast,
  Badge,
  Input,
  Select,
  SimpleGrid,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { AddIcon, CalendarIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Report {
  id: number;
  content: string;
  user_id: string;
  user_role: string;
  created_at: string;
  updated_at: string;
}

interface Filter {
  startDate: string;
  endDate: string;
  role: string;
}

export function ReportsDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReportContent, setNewReportContent] = useState('');
  const [filter, setFilter] = useState<Filter>({
    startDate: '',
    endDate: '',
    role: '',
  });
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  async function fetchReports() {
    setIsLoading(true);
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    // Se não for admin, mostrar apenas os próprios relatórios
    if (appUser?.role !== 'admin') {
      query = query.eq('user_id', appUser?.id);
    }

    // Aplicar filtros
    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte('created_at', `${filter.endDate}T23:59:59`);
    }
    if (filter.role && appUser?.role === 'admin') {
      query = query.eq('user_role', filter.role);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Erro ao buscar relatórios',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setReports(data || []);
    setIsLoading(false);
  }

  async function handleCreateReport() {
    if (!appUser) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('reports')
      .insert([
        {
          content: newReportContent,
          user_id: appUser.id,
          user_role: appUser.role,
        }
      ]);

    if (error) {
      toast({
        title: 'Erro ao criar relatório',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Relatório criado com sucesso',
        status: 'success',
        duration: 2000,
      });
      setNewReportContent('');
      onCreateClose();
      fetchReports();
    }
    
    setIsLoading(false);
  }

  function handleViewReport(report: Report) {
    setSelectedReport(report);
    onViewOpen();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'admin':
        return 'red';
      case 'support':
        return 'blue';
      default:
        return 'gray';
    }
  }

  function translateRole(role: string) {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'support':
        return 'Suporte';
      default:
        return role;
    }
  }

  function handleApplyDateFilter() {
    fetchReports();
    onFilterClose();
  }

  function handleClearDateFilter() {
    setFilter(prev => ({
      ...prev,
      startDate: '',
      endDate: ''
    }));
    onFilterClose();
  }

  if (!appUser) {
    return (
      <Card>
        <CardBody>
          <Text>Você precisa estar logado para acessar esta página.</Text>
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
              <Heading size="md">Relatórios</Heading>
              <Text color="gray.500" mt={1}>
                Gerencie os relatórios de atividades
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
              Novo Relatório
            </Button>
          </Flex>

          <Grid templateColumns={appUser.role === 'admin' ? "repeat(2, 1fr)" : "repeat(1, 1fr)"} gap={4}>
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
            {appUser.role === 'admin' && (
              <Select
                value={filter.role}
                onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                placeholder="Todos os cargos"
              >
                <option value="admin">Administrador</option>
                <option value="support">Suporte</option>
              </Select>
            )}
          </Grid>
        </Stack>
      </CardHeader>

      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {reports.map((report) => (
            <Card key={report.id} variant="outline" cursor="pointer" onClick={() => handleViewReport(report)}>
              <CardBody>
                <Stack spacing={3}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Badge colorScheme={getRoleBadgeColor(report.user_role)}>
                      {translateRole(report.user_role)}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(report.created_at)}
                    </Text>
                  </Flex>
                  <Text noOfLines={3}>{report.content}</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    bg="#FFDB01"
                    color="black"
                    _hover={{ bg: "#e5c501" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewReport(report);
                    }}
                  >
                    Ver mais
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {reports.length === 0 && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">
              Nenhum relatório encontrado
            </Text>
          </Box>
        )}
      </CardBody>

      {/* Modal de criação de relatório */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Relatório</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Box>
                <Text mb={2}>Cargo: <Badge colorScheme={getRoleBadgeColor(appUser.role)}>{translateRole(appUser.role)}</Badge></Text>
                <Text fontSize="sm" color="gray.500">O relatório será registrado com seu cargo atual.</Text>
              </Box>
              <Textarea
                value={newReportContent}
                onChange={(e) => setNewReportContent(e.target.value)}
                placeholder="Descreva suas atividades..."
                size="sm"
                rows={10}
              />
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
              onClick={handleCreateReport}
              isLoading={isLoading}
              isDisabled={!newReportContent.trim()}
            >
              Enviar Relatório
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de visualização de relatório */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes do Relatório</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReport && (
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold">Data:</Text>
                  <Text>{formatDate(selectedReport.created_at)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Cargo:</Text>
                  <Badge colorScheme={getRoleBadgeColor(selectedReport.user_role)}>
                    {translateRole(selectedReport.user_role)}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Conteúdo:</Text>
                  <Text whiteSpace="pre-wrap">{selectedReport.content}</Text>
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
              <FormControl>
                <FormLabel>Data Inicial</FormLabel>
                <Input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Data Final</FormLabel>
                <Input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                />
              </FormControl>
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
    </Card>
  );
} 