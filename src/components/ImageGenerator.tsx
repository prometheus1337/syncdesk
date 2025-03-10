import { useState } from 'react';
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
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { Layout } from './Layout';
import { supabase } from '../lib/supabase';

interface GeneratedImage {
  url: string;
  prompt: string;
  createdAt: Date;
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const toast = useToast();

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

    try {
      console.log('Iniciando geração de imagem...');
      
      const { data: result, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, aspect_ratio: aspectRatio },
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Resposta da função:', { result, error });

      if (error) {
        console.error('Erro detalhado da função:', error);
        throw new Error(
          error.message || 
          (error as any)?.context?.message || 
          'Erro ao gerar imagem'
        );
      }

      if (!result?.output?.[0]) {
        console.error('Resposta sem output:', result);
        throw new Error(
          result?.error || 
          'Falha na geração da imagem: resposta inválida'
        );
      }

      const newImage: GeneratedImage = {
        url: result.output[0],
        prompt,
        createdAt: new Date(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);

      toast({
        title: 'Sucesso',
        description: 'Imagem gerada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Erro completo:', error);
      const errorMessage = error.message || 
        error.details || 
        error.toString() ||
        'Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.';
      
      toast({
        title: 'Erro ao gerar imagem',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
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
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Proporção</FormLabel>
                    <Select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                    >
                      <option value="1:1">Quadrado (1:1)</option>
                      <option value="16:9">Paisagem (16:9)</option>
                      <option value="9:16">Retrato (9:16)</option>
                    </Select>
                  </FormControl>

                  <Button
                    onClick={handleGenerate}
                    isLoading={isGenerating}
                    loadingText="Gerando..."
                    bg="#FFDB01"
                    color="black"
                    _hover={{ bg: "#e5c501" }}
                    width="full"
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