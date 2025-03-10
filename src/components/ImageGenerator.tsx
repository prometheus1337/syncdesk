import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Select,
  Progress,
  Image,
  Text,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const toast = useToast();

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setImageUrl(null);

    try {
      // Chamar a função Edge do Supabase
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, aspectRatio }
      });

      if (error) throw error;

      if (data.status === 'succeeded' && data.output) {
        setProgress(100);
        setImageUrl(data.output);
        
        // Salvar a imagem gerada no banco
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            url: data.output,
            prompt: prompt,
          });

        if (dbError) {
          console.error('Erro ao salvar imagem:', dbError);
        }

        toast({
          title: 'Sucesso',
          description: 'Imagem gerada com sucesso!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Falha ao gerar imagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar imagem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Prompt</FormLabel>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva a imagem que você quer gerar..."
            disabled={isLoading}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Proporção</FormLabel>
          <Select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            disabled={isLoading}
          >
            <option value="1:1">Quadrado (1:1)</option>
            <option value="3:4">Retrato (3:4)</option>
            <option value="4:3">Paisagem (4:3)</option>
            <option value="16:9">Widescreen (16:9)</option>
          </Select>
        </FormControl>

        <Button
          onClick={handleGenerate}
          isLoading={isLoading}
          loadingText="Gerando..."
          colorScheme="yellow"
          size="lg"
        >
          Gerar Imagem
        </Button>

        {isLoading && (
          <Box>
            <Text mb={2} textAlign="center">Gerando imagem... {progress}%</Text>
            <Progress value={progress} size="sm" colorScheme="yellow" />
          </Box>
        )}

        {imageUrl && (
          <Card>
            <CardBody>
              <Image
                src={imageUrl}
                alt="Imagem gerada"
                borderRadius="lg"
                w="100%"
                h="auto"
              />
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
} 