import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  useToast,
  Container,
  Spinner,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Ambassador {
  id: string;
  user_id: string;
  metabase_question_id: string;
  created_at: string;
}

export function AmbassadorDashboard() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    if (appUser?.id) {
      fetchAmbassadorData();
    }
  }, [appUser?.id]);

  async function fetchAmbassadorData() {
    try {
      const { data: ambassador, error } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('user_id', appUser?.id)
        .single() as { data: Ambassador | null; error: any };

      if (error) throw error;

      if (ambassador) {
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_metabase_token', {
            question_id: ambassador.metabase_question_id
          });

        if (tokenError) throw tokenError;

        setIframeUrl(tokenData);
      }
    } catch (error: any) {
      console.error('Error fetching ambassador data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" color="#FFDB01" />
      </Box>
    );
  }

  if (!iframeUrl) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Heading size="lg" mb={4}>Nenhum gráfico encontrado</Heading>
          <Text color="gray.600">
            Você ainda não tem um gráfico do Metabase vinculado ao seu perfil.
            Entre em contato com o administrador para configurar seu dashboard.
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" p={6}>
      <Container maxW="container.xl">
        <Box mb={8}>
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

        <Box
          bg="white"
          borderRadius="md"
          boxShadow="sm"
          overflow="hidden"
          height="calc(100vh - 200px)"
        >
          <iframe
            src={iframeUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="clipboard-write"
          />
        </Box>
      </Container>
    </Box>
  );
} 