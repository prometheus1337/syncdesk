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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
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

export function ReportsDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReportContent, setNewReportContent] = useState('');
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

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
              colorScheme="blue"
              onClick={onCreateOpen}
              size="sm"
            >
              Novo Relatório
            </Button>
          </Flex>
        </Stack>
      </CardHeader>

      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Data</Th>
              <Th>Cargo</Th>
              <Th>Conteúdo</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {reports.map((report) => (
              <Tr key={report.id}>
                <Td whiteSpace="nowrap">{formatDate(report.created_at)}</Td>
                <Td>
                  <Badge colorScheme={getRoleBadgeColor(report.user_role)}>
                    {translateRole(report.user_role)}
                  </Badge>
                </Td>
                <Td>
                  <Text noOfLines={2}>{report.content}</Text>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewReport(report)}
                  >
                    Visualizar
                  </Button>
                </Td>
              </Tr>
            ))}
            {reports.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center" py={8}>
                  <Text color="gray.500">
                    Nenhum relatório encontrado
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
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
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
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
            <Button colorScheme="blue" onClick={onViewClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
} 