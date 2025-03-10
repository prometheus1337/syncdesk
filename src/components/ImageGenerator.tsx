import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Image,
  Grid,
  Text,
  useToast,
  Container,
  Heading,
  Card,
  CardBody,
  AspectRatio,
  IconButton,
  Flex,
  Progress,
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { Layout } from './Layout';

interface GeneratedImage {
  url: string;
  prompt: string;
  createdAt: Date;
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
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
    if (!prompt.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um prompt para gerar a imagem.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar imagem',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
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

            <Box>
              <Heading as="h2" size="md" mb={4}>
                Imagens Geradas
              </Heading>
              <Grid
                templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                gap={6}
              >
                {generatedImages.map((image, index) => (
                  <Card key={index} overflow="hidden">
                    <AspectRatio ratio={1}>
                      <Image
                        src={image.url}
                        alt={image.prompt}
                        objectFit="cover"
                      />
                    </AspectRatio>
                    <CardBody>
                      <Text fontSize="sm" noOfLines={2} mb={2}>
                        {image.prompt}
                      </Text>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500">
                          {image.createdAt.toLocaleDateString()}
                        </Text>
                        <IconButton
                          aria-label="Download"
                          icon={<DownloadIcon />}
                          size="sm"
                          onClick={() => handleDownload(image.url)}
                        />
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
} 