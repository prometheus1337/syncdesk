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
  Spinner,
  Flex,
  AspectRatio,
  IconButton,
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
  created_by: string;
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const { appUser } = useAuth();

  const fetchGeneratedImages = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGeneratedImages(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar imagens',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneratedImages();
  }, []);

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
        body: {
          prompt,
          aspect_ratio: aspectRatio,
        },
      });

      console.log('Resposta da função:', { result, error });

      if (error) {
        console.error('Erro detalhado da função:', error);
        throw error;
      }

      if (!result?.output) {
        console.error('Resposta sem output:', result);
        throw new Error('Falha na geração da imagem: resposta inválida');
      }

      console.log('Salvando imagem no banco...');

      const { data: imageData, error: imageError } = await supabase
        .from('generated_images')
        .insert({
          url: result.output[0],
          prompt,
          created_by: appUser?.id,
        })
        .select()
        .single();

      if (imageError) {
        console.error('Erro ao salvar imagem:', imageError);
        throw imageError;
      }

      console.log('Imagem salva com sucesso:', imageData);

      setGeneratedImages([imageData, ...generatedImages]);

      toast({
        title: 'Sucesso',
        description: 'Imagem gerada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast({
        title: 'Erro ao gerar imagem',
        description: error.message || 'Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.',
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
            {isLoading ? (
              <Flex justify="center" p={8}>
                <Spinner size="xl" color="#FFDB01" />
              </Flex>
            ) : (
              <Grid
                templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                gap={6}
              >
                {generatedImages.map((image) => (
                  <Card key={image.id} overflow="hidden">
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
                          {new Date(image.created_at).toLocaleDateString()}
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
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
} 