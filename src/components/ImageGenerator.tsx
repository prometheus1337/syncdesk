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
  Grid,
  GridItem,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Center,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';

interface ImageGeneratorParams {
  prompt: string;
  aspectRatio: string;
  guidanceScale: number;
  numInferenceSteps: number;
  promptStrength: number;
  loraScale: number;
}

const defaultParams: ImageGeneratorParams = {
  prompt: '',
  aspectRatio: '1:1',
  guidanceScale: 3,
  numInferenceSteps: 28,
  promptStrength: 0.8,
  loraScale: 1,
};

export function ImageGenerator() {
  const [params, setParams] = useState<ImageGeneratorParams>(defaultParams);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const toast = useToast();

  const progressTimer = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress >= 100) {
        clearInterval(interval);
        return;
      }
      currentProgress += 4; // 25 segundos total (100 / 25 = 4)
      setProgress(Math.min(currentProgress, 95)); // Mantém em 95% até terminar
    }, 1000);
    return interval;
  };

  const handleGenerate = async () => {
    if (!params.prompt) {
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

    const interval = progressTimer();

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          aspectRatio: params.aspectRatio,
          guidance_scale: params.guidanceScale,
          num_inference_steps: params.numInferenceSteps,
          prompt_strength: params.promptStrength,
          lora_scale: params.loraScale,
        }
      });

      if (error) throw error;

      if (data.status === 'succeeded' && data.output) {
        clearInterval(interval);
        setProgress(100);
        setImageUrl(data.output);
        
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            url: data.output,
            prompt: params.prompt,
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
      clearInterval(interval);
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
    <Grid templateColumns="repeat(2, 1fr)" gap={6} p={6} maxW="1400px" mx="auto">
      {/* Controles à esquerda */}
      <GridItem>
        <VStack spacing={6} align="stretch" maxW="500px">
          <FormControl>
            <FormLabel>Prompt</FormLabel>
            <Input
              value={params.prompt}
              onChange={(e) => setParams({ ...params, prompt: e.target.value })}
              placeholder="Descreva a imagem que você quer gerar..."
              isDisabled={isLoading}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Proporção</FormLabel>
            <Select
              value={params.aspectRatio}
              onChange={(e) => setParams({ ...params, aspectRatio: e.target.value })}
              isDisabled={isLoading}
            >
              <option value="1:1">Quadrado (1:1)</option>
              <option value="3:4">Retrato (3:4)</option>
              <option value="4:3">Paisagem (4:3)</option>
              <option value="16:9">Widescreen (16:9)</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Guidance Scale ({params.guidanceScale})</FormLabel>
            <Slider
              value={params.guidanceScale}
              onChange={(v) => setParams({ ...params, guidanceScale: v })}
              min={1}
              max={20}
              step={0.1}
              isDisabled={isLoading}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <FormControl>
            <FormLabel>Inference Steps</FormLabel>
            <NumberInput
              value={params.numInferenceSteps}
              onChange={(_, v) => setParams({ ...params, numInferenceSteps: v })}
              min={1}
              max={50}
              isDisabled={isLoading}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Prompt Strength ({params.promptStrength})</FormLabel>
            <Slider
              value={params.promptStrength}
              onChange={(v) => setParams({ ...params, promptStrength: v })}
              min={0}
              max={1}
              step={0.1}
              isDisabled={isLoading}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <FormControl>
            <FormLabel>LoRA Scale ({params.loraScale})</FormLabel>
            <Slider
              value={params.loraScale}
              onChange={(v) => setParams({ ...params, loraScale: v })}
              min={0}
              max={2}
              step={0.1}
              isDisabled={isLoading}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
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
        </VStack>
      </GridItem>

      {/* Área da imagem à direita */}
      <GridItem>
        <Box
          h="100%"
          minH="600px"
          borderWidth={1}
          borderRadius="lg"
          p={6}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          {isLoading ? (
            <VStack spacing={4}>
              <CircularProgress
                value={progress}
                size="120px"
                thickness="4px"
                color="yellow.400"
              >
                <CircularProgressLabel>{progress}%</CircularProgressLabel>
              </CircularProgress>
              <Text>Gerando sua imagem...</Text>
            </VStack>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt="Imagem gerada"
              borderRadius="lg"
              w="100%"
              h="auto"
              maxH="600px"
              objectFit="contain"
            />
          ) : (
            <Text color="gray.500">
              A imagem gerada aparecerá aqui
            </Text>
          )}
        </Box>
      </GridItem>
    </Grid>
  );
} 