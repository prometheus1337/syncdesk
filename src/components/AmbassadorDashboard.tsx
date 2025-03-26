import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Container,
  Box,
  Heading,
  Text,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useDisclosure,
  IconButton,
  Flex,
  Tooltip
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import styles from './AmbassadorDashboard.module.css';
import { useAuth } from '../contexts/AuthContext';

interface Ambassador {
  id: string;
  user_id: string;
  metabase_question_id: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

// Função para gerar o token JWT
async function generateMetabaseToken(dashboardId: string) {
  const METABASE_SITE_URL = 'https://metabase-production-b92e.up.railway.app';
  const METABASE_SECRET_KEY = '74197c75b058669dd254f4eadb4551621983efa532c16c4bb61d90d0cb565188';

  // Converte o ID para número se for string
  const dashboardIdNumber = parseInt(dashboardId, 10);
  if (isNaN(dashboardIdNumber)) {
    throw new Error(`ID inválido: ${dashboardId}`);
  }

  // Cria o payload para dashboard
  const payload = {
    resource: { dashboard: dashboardIdNumber },
    params: {},
    exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minutos
  };

  console.log('Payload do token:', payload);

  // Converte para base64url
  const encodeBase64URL = (str: string) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Cria as partes do token
  const header = encodeBase64URL(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadBase64 = encodeBase64URL(JSON.stringify(payload));

  // Gera a chave para assinatura
  const encoder = new TextEncoder();
  const keyData = encoder.encode(METABASE_SECRET_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Gera a assinatura
  const signatureInput = `${header}.${payloadBase64}`;
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  // Converte o buffer para base64url
  const signature = encodeBase64URL(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  // Monta o token final
  const token = `${header}.${payloadBase64}.${signature}`;
  
  // Retorna a URL completa com os parâmetros de estilo
  return `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`;
}

export default function AmbassadorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();

  const [formData, setFormData] = useState({
    user_id: '',
    metabase_question_id: ''
  });

  useEffect(() => {
    fetchAmbassadorData();
    if (appUser?.role === 'admin') {
      fetchUsers();
    }
  }, [appUser?.role]);

  const fetchUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(users || []);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      toast({
        title: 'Erro ao carregar usuários',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchAmbassadorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Busca os dados do embaixador
      const { data: ambassadorData, error: ambassadorError } = await supabase
        .from('ambassadors')
        .select('*')
        .single();

      if (ambassadorError) throw ambassadorError;
      if (!ambassadorData) throw new Error('Embaixador não encontrado');

      setAmbassador(ambassadorData);
      setFormData({
        user_id: ambassadorData.user_id,
        metabase_question_id: ambassadorData.metabase_question_id
      });

      if (!ambassadorData.metabase_question_id) {
        throw new Error('ID do dashboard não configurado');
      }

      // Gera o token e URL do iframe
      try {
        const embedUrl = await generateMetabaseToken(ambassadorData.metabase_question_id);
        console.log('URL gerada:', embedUrl);
        setIframeUrl(embedUrl);
      } catch (tokenError: any) {
        console.error('Erro ao gerar token:', tokenError);
        throw new Error(`Erro ao gerar URL do dashboard: ${tokenError.message}`);
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar o dashboard');
      toast({
        title: 'Erro ao carregar dados',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAmbassador = async () => {
    try {
      if (!ambassador) return;

      const { error } = await supabase
        .from('ambassadors')
        .update({
          user_id: formData.user_id,
          metabase_question_id: formData.metabase_question_id
        })
        .eq('id', ambassador.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Informações do embaixador atualizadas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchAmbassadorData();
    } catch (err: any) {
      console.error('Erro ao atualizar embaixador:', err);
      toast({
        title: 'Erro ao atualizar',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading size="lg" mb={4} color="red.500">Erro</Heading>
          <Text color="gray.600">
            {error}
          </Text>
          <Text color="gray.500" mt={2}>
            Por favor, tente novamente mais tarde ou contate o suporte.
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Box p={6}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading
              as="h1"
              fontSize="24px"
              fontWeight="500"
              color="gray.700"
              mb="2"
            >
              Dashboard do Embaixador
            </Heading>
            <Text color="gray.500">
              Visualize os dados e métricas do seu perfil
            </Text>
          </Box>

          {appUser?.role === 'admin' && (
            <Tooltip label="Editar configurações">
              <IconButton
                aria-label="Editar configurações"
                icon={<EditIcon />}
                onClick={onOpen}
                colorScheme="blue"
              />
            </Tooltip>
          )}
        </Flex>
        
        {iframeUrl && (
          <Box 
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            overflow="hidden"
            height="calc(100vh - 200px)"
          >
            <iframe
              src={iframeUrl}
              className={styles.metabaseIframe}
              frameBorder="0"
              allowTransparency
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </Box>
        )}

        {/* Modal de Edição */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Editar Configurações do Embaixador</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Usuário</FormLabel>
                  <Input
                    as="select"
                    value={formData.user_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </Input>
                </FormControl>

                <FormControl>
                  <FormLabel>ID do Dashboard Metabase</FormLabel>
                  <Input
                    value={formData.metabase_question_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, metabase_question_id: e.target.value }))}
                    placeholder="Ex: 45"
                  />
                </FormControl>

                <Button
                  colorScheme="blue"
                  width="100%"
                  onClick={handleUpdateAmbassador}
                >
                  Salvar Alterações
                </Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
} 