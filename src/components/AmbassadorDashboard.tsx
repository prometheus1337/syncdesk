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

// Função para gerar o token JWT
async function generateMetabaseToken(questionId: string) {
  const METABASE_SITE_URL = 'https://metabase-production-b92e.up.railway.app';
  const METABASE_SECRET_KEY = 'your-secret-key-here';

  // Cria o payload
  const payload = {
    resource: { question: questionId },
    params: {},
    exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minutos
  };

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
  
  // Retorna a URL completa
  return `${METABASE_SITE_URL}/embed/question/${token}`;
}

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

      // Gera o token e URL do iframe
      try {
        const embedUrl = await generateMetabaseToken(ambassadorData.metabase_question_id);
        setIframeUrl(embedUrl);
      } catch (tokenError: any) {
        console.error('Erro ao gerar token:', tokenError);
        throw new Error('Erro ao gerar URL do dashboard');
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
              sandbox="allow-same-origin allow-scripts"
            />
          </Box>
        )}
      </Container>
    </Box>
  );
} 