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
} from '@chakra-ui/react';

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [progress]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      // Cria a predição
      const createResponse = await fetch(`${CORS_PROXY}${REPLICATE_API}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          version: "prometheus1337/pvo-ai-md:46bbd3d415fa5ec4d2f1a931a0e9c686da9131da6235b81be3d1bb4dca700290",
          input: {
            prompt,
            model: "dev",
            go_fast: false,
            lora_scale: 1,
            megapixels: "1",
            num_outputs: 1,
            aspect_ratio: aspectRatio,
            output_format: "webp",
            guidance_scale: 3,
            output_quality: 80,
            prompt_strength: 0.8,
            extra_lora_scale: 1,
            num_inference_steps: 28
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error(`HTTP error! status: ${createResponse.status}`);
      }

      const prediction = await createResponse.json();
      
      // Aguarda a conclusão da geração
      let result = prediction;
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`${CORS_PROXY}${REPLICATE_API}/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
            'Origin': window.location.origin
          }
        });
        result = await statusResponse.json();
      }

      if (result.status === 'failed') {
        throw new Error('Falha ao gerar imagem');
      }

      if (!result.output?.[0]) {
        throw new Error('Nenhuma imagem foi gerada');
      }

      toast({
        title: 'Imagem gerada com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: 'Erro ao gerar imagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
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
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
} 