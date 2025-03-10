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
} from '@chakra-ui/react';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + (100/80); // Incrementa para completar em 8 segundos (80 * 100ms)
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
      await fetch('https://webhook-processor-production-242a.up.railway.app/webhook/37d2c776-745f-478b-9a41-12c1139f3059', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
        })
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
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