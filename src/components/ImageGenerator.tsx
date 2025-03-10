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
      // Criar a predição
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "46bbd3d415fa5ec4d2f1a931a0e9c686da9131da6235b81be3d1bb4dca700290",
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
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const prediction = await response.json();
      
      // Aguardar a conclusão da geração
      let result = prediction;
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        setProgress((prev) => Math.min(prev + 10, 90));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Token ${import.meta.env.VITE_REPLICATE_API_TOKEN}`,
          },
        });
        
        if (!statusResponse.ok) {
          throw new Error('Erro ao verificar status da geração');
        }
        
        result = await statusResponse.json();
      }

      if (result.status === 'succeeded') {
        setProgress(100);
        setImageUrl(result.output[0]);
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