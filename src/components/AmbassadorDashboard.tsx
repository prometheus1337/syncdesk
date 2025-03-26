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
import styles from './AmbassadorDashboard.module.css';

// Função para gerar o token JWT
async function generateMetabaseToken(questionId: string) {
  const METABASE_SITE_URL = 'https://metabase.syncdesk.com.br';
  const METABASE_SECRET_KEY = '74197c75b058669dd254f4eadb4551621983efa532c16c4bb61d90d0cb565188';

  // Converte o ID para número se for string
  const questionIdNumber = parseInt(questionId, 10);
  if (isNaN(questionIdNumber)) {
    throw new Error(`ID inválido: ${questionId}`);
  }

  // Cria o payload exatamente como no exemplo
  const payload = {
    resource: { question: questionIdNumber },
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
  return `${METABASE_SITE_URL}/embed/question/${token}#bordered=true&titled=true`;
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
        .select('id, metabase_question_id')
        .single();

      if (ambassadorError) throw ambassadorError;
      if (!ambassadorData) throw new Error('Embaixador não encontrado');

      console.log('Dados do embaixador:', {
        id: ambassadorData.id,
        metabase_id: ambassadorData.metabase_question_id,
        tipo: typeof ambassadorData.metabase_question_id
      });

      if (!ambassadorData.metabase_question_id) {
        throw new Error('ID da questão não configurado');
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
              className={styles.metabaseIframe}
              frameBorder="0"
              allowTransparency
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </Box>
        )}
      </Container>
    </Box>
  );
} 