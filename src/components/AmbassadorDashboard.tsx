import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

interface Ambassador {
  id: string;
  name: string;
  metabase_question_id: number;
}

export const AmbassadorDashboard: React.FC = () => {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const toast = useToast();

  useEffect(() => {
    fetchAmbassadorData();
  }, []);

  const fetchAmbassadorData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('ambassadors')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast({
        title: 'Erro ao carregar dados do embaixador',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setAmbassador(data);

    // Gera o token do Metabase
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_metabase_token', { question_id: data.metabase_question_id });

    if (tokenError) {
      toast({
        title: 'Erro ao gerar token do Metabase',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIframeUrl(tokenData);
  };

  if (!ambassador) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading>Carregando...</Heading>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={6}>
        <Heading size="lg">Dashboard do Embaixador</Heading>
      </Box>

      {iframeUrl && (
        <Box
          width="100%"
          height="800px"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          <iframe
            src={iframeUrl}
            frameBorder="0"
            width="100%"
            height="100%"
            allowTransparency
          />
        </Box>
      )}
    </Container>
  );
}; 