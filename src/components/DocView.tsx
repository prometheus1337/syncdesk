import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Button,
  Spinner,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { Global } from '@emotion/react';

// Adicionar estilos globais para o conteúdo do TinyMCE
const globalStyles = `
  .content-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .content-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1rem 0;
    display: block;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .content-preview table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    display: block;
    overflow-x: auto;
  }

  .content-preview th,
  .content-preview td {
    border: 1px solid #e2e8f0;
    padding: 0.5rem;
  }

  .content-preview th {
    background-color: #f7fafc;
    font-weight: 600;
  }

  .content-preview tr:nth-child(2n) {
    background-color: #f8fafc;
  }

  .content-preview p {
    margin: 1rem 0;
    line-height: 1.6;
  }

  .content-preview h1,
  .content-preview h2,
  .content-preview h3,
  .content-preview h4,
  .content-preview h5,
  .content-preview h6 {
    margin: 1.5rem 0 1rem;
    line-height: 1.4;
    font-weight: 600;
  }

  .content-preview h1 {
    font-size: 2em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }

  .content-preview h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }

  .content-preview h3 {
    font-size: 1.25em;
  }

  .content-preview h4 {
    font-size: 1em;
  }

  .content-preview h5 {
    font-size: 0.875em;
  }

  .content-preview h6 {
    font-size: 0.85em;
    color: #6a737d;
  }

  .content-preview ul,
  .content-preview ol {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  .content-preview li {
    margin: 0.5rem 0;
  }

  .content-preview a {
    color: #3182ce;
    text-decoration: none;
  }

  .content-preview a:hover {
    text-decoration: underline;
    color: #2c5282;
  }

  .content-preview blockquote {
    border-left: 4px solid #e2e8f0;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #4a5568;
  }

  .content-preview code {
    background-color: #f7fafc;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875em;
  }

  .content-preview pre {
    background-color: #f7fafc;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1rem 0;
  }

  .content-preview pre code {
    background-color: transparent;
    padding: 0;
    font-size: 0.875em;
    color: inherit;
  }

  .content-preview hr {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 2rem 0;
  }

  .content-preview iframe {
    max-width: 100%;
    border-radius: 8px;
    margin: 1rem 0;
    border: 1px solid #e2e8f0;
  }

  .content-preview video {
    max-width: 100%;
    border-radius: 8px;
    margin: 1rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .content-preview audio {
    width: 100%;
    margin: 1rem 0;
  }

  .content-preview figure {
    margin: 1.5rem 0;
    text-align: center;
  }

  .content-preview figcaption {
    color: #4a5568;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  /* Estilos para o modo escuro */
  .chakra-ui-dark .content-preview {
    color: #e2e8f0;
  }

  .chakra-ui-dark .content-preview h1,
  .chakra-ui-dark .content-preview h2 {
    border-bottom-color: #2d3748;
  }

  .chakra-ui-dark .content-preview code {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .chakra-ui-dark .content-preview pre {
    background-color: #2d3748;
  }

  .chakra-ui-dark .content-preview table th,
  .chakra-ui-dark .content-preview table td {
    border-color: #4a5568;
  }

  .chakra-ui-dark .content-preview table tr {
    background-color: transparent;
  }

  .chakra-ui-dark .content-preview table tr:nth-child(2n) {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .chakra-ui-dark .content-preview blockquote {
    color: #a0aec0;
    border-left-color: #4a5568;
  }

  .chakra-ui-dark .content-preview a {
    color: #63b3ed;
  }

  .chakra-ui-dark .content-preview a:hover {
    color: #4299e1;
  }

  .chakra-ui-dark .content-preview hr {
    background-color: #4a5568;
  }

  .chakra-ui-dark .content-preview iframe {
    border-color: #4a5568;
  }

  .chakra-ui-dark .content-preview figcaption {
    color: #a0aec0;
  }

  /* Ajustes de acessibilidade */
  .content-preview :focus {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  .content-preview a:focus {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  /* Ajustes de responsividade */
  @media (max-width: 768px) {
    .content-preview {
      padding: 0 0.5rem;
    }

    .content-preview table {
      font-size: 0.875rem;
    }

    .content-preview pre {
      font-size: 0.8125rem;
    }
  }

  /* Ajustes de impressão */
  @media print {
    .content-preview {
      max-width: none;
      padding: 0;
    }

    .content-preview pre,
    .content-preview code {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .content-preview a {
      text-decoration: underline;
    }

    .content-preview img,
    .content-preview video {
      max-height: 500px;
      page-break-inside: avoid;
    }
  }
`;

interface Doc {
  id: string;
  title: string;
  content: string;
  section_id: string;
  parent_id: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export function DocView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    async function fetchDoc() {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from('doc_items')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setDoc(data);
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar documento',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDoc();
  }, [id, toast]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!doc) {
    return (
      <Flex direction="column" align="center" justify="center" minH="100vh">
        <Heading size="lg" mb={4}>Documento não encontrado</Heading>
        <Button
          leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
          onClick={() => navigate('/documentos')}
        >
          Voltar para Documentos
        </Button>
      </Flex>
    );
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Global styles={globalStyles} />
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg" color={textColor}>{doc.title}</Heading>
        <Button
          leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
          onClick={() => navigate('/documentos')}
          size="sm"
          variant="outline"
          colorScheme="yellow"
        >
          Voltar
        </Button>
      </Flex>
      <Box className="content-preview" dangerouslySetInnerHTML={{ __html: doc.content }} />
    </Box>
  );
} 