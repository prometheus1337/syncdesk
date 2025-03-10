import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
  Container,
  Heading,
  Card,
  CardBody,
  Progress,
  useToast,
  Image,
} from '@chakra-ui/react';

const GENERATE_IMAGE_URL = 'https://vjokrgwwlhioqeqwlasz.supabase.co/functions/v1/generate-image';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Modelo público do Stable Diffusion
const MODEL_VERSION = "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671b11e0cedff1654753b5785cd";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + (100/80);
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setImageUrl(null);

    try {
      console.log('Iniciando geração de imagem:', { prompt, aspectRatio });
      
      const response = await fetch(GENERATE_IMAGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ 
          prompt,
          aspectRatio,
          modelVersion: MODEL_VERSION
        })
      });

      const responseText = await response.text();
      console.log('Resposta da API:', { status: response.status, body: responseText });

      if (!response.ok) {
        throw new Error(`Erro na API: status ${response.status}, mensagem: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
        throw new Error('Resposta inválida do servidor');
      }

      if (data.error) {
        throw new Error(`Erro do servidor: ${data.error}`);
      }

      if (!data.output?.[0]) {
        throw new Error('Nenhuma imagem foi gerada');
      }

      console.log('Imagem gerada com sucesso:', data.output[0]);
      setImageUrl(data.output[0]);

      toast({
        title: 'Imagem gerada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Erro detalhado:', error);
      toast({
        title: 'Erro ao gerar imagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" p={6}>
      <Container maxW="6xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="lg" mb={2}>
              Gerador de Imagens AI
            </Heading>
            <Text color="gray.600">
              Gere imagens únicas usando inteligência artificial
            </Text>
          </Box>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Prompt</FormLabel>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Descreva a imagem que você quer gerar..."
                    isDisabled={isGenerating}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Proporção</FormLabel>
                  <Select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    isDisabled={isGenerating}
                  >
                    <option value="1:1">Quadrado (1:1)</option>
                    <option value="16:9">Paisagem (16:9)</option>
                    <option value="9:16">Retrato (9:16)</option>
                  </Select>
                </FormControl>

                {isGenerating && (
                  <Box w="100%">
                    <Text mb={2} textAlign="center">
                      Gerando imagem... {Math.round(progress)}%
                    </Text>
                    <Progress 
                      value={progress} 
                      size="sm" 
                      colorScheme="yellow" 
                      borderRadius="full"
                      isAnimated
                      hasStripe
                    />
                  </Box>
                )}

                <Button
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  loadingText="Gerando..."
                  bg="#FFDB01"
                  color="black"
                  _hover={{ bg: "#e5c501" }}
                  width="full"
                  isDisabled={isGenerating || !prompt.trim()}
                >
                  Gerar Imagem
                </Button>

                {imageUrl && (
                  <Box 
                    w="100%" 
                    borderRadius="md" 
                    overflow="hidden"
                    boxShadow="md"
                  >
                    <Image 
                      src={imageUrl} 
                      alt={prompt}
                      w="100%"
                      h="auto"
                    />
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
} 