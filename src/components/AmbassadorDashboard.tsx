import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Container,
  Box,
  Heading,
  Text,
  Spinner
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';

export default function AmbassadorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchAmbassadorData();
  }, []);

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

      // Gera o token para o iframe
      const { data: embedUrl, error: embedError } = await supabase
        .rpc('generate_metabase_token', {
          question_id: ambassadorData.metabase_question_id
        });

      if (embedError) throw embedError;
      if (!embedUrl) throw new Error('Erro ao gerar URL do dashboard');

      setIframeUrl(embedUrl);
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
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              frameBorder="0"
              allowTransparency
            />
          </Box>
        )}
      </Container>
    </Box>
  );
} 