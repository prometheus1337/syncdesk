import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Image,
  useToast,
  Text,
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
  CircularProgress,
  CircularProgressLabel,
  Textarea,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';

interface ImageParams {
  prompt: string;
  negativePrompt: string;
  guidanceScale: number;
  numInferenceSteps: number;
  promptStrength: number;
  loraScale: number;
  aspectRatio: string;
}

// Componente personalizado para o input do prompt
const HighlightedInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  // Função para renderizar o texto com destaque
  const renderHighlightedText = () => {
    const parts = value.split(/(vinepvo)/gi);
    return parts.map((part, i) => 
      part.toLowerCase() === 'vinepvo' ? 
        <Text as="span" key={i} color="green.500" fontWeight="bold">{part}</Text> : 
        part
    );
  };

  return (
    <Box position="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Descreva a imagem que você quer gerar"
        size="md"
        resize="vertical"
        minH="100px"
        bg="white"
      />
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        p={2}
        pointerEvents="none"
        whiteSpace="pre-wrap"
        overflowWrap="break-word"
        color="transparent"
      >
        {renderHighlightedText()}
      </Box>
    </Box>
  );
};

export const ImageGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [params, setParams] = useState<ImageParams>({
    prompt: '',
    negativePrompt: '',
    guidanceScale: 3.5,
    numInferenceSteps: 25,
    promptStrength: 0.8,
    loraScale: 0.6,
    aspectRatio: '1:1',
  });

  const toast = useToast();

  const handleGenerate = async () => {
    if (!params.prompt.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt,
          guidance_scale: params.guidanceScale,
          num_inference_steps: params.numInferenceSteps,
          prompt_strength: params.promptStrength,
          lora_scale: params.loraScale,
          aspect_ratio: params.aspectRatio,
        },
      });

      if (error) throw error;

      setImageUrl(data.output);
      toast({
        title: 'Sucesso',
        description: 'Imagem gerada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar imagem. Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={6} p={6} maxW="1400px" mx="auto">
      <GridItem>
        <Stack spacing={6} align="stretch" maxW="500px">
          <Box 
            p={4} 
            bg="yellow.100" 
            borderRadius="md"
            borderLeft="4px"
            borderLeftColor="yellow.400"
          >
            <Text fontSize="sm" color="yellow.800">
              Importante: Para se referir ao Vine em suas imagens, sempre use o termo "vinepvo".
            </Text>
          </Box>

          <FormControl isRequired>
            <FormLabel>Prompt</FormLabel>
            <HighlightedInput
              value={params.prompt}
              onChange={(value) => setParams({ ...params, prompt: value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Prompt Negativo</FormLabel>
            <Input
              value={params.negativePrompt}
              onChange={(e) => setParams({ ...params, negativePrompt: e.target.value })}
              placeholder="Descreva o que você não quer na imagem"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Guidance Scale ({params.guidanceScale})</FormLabel>
            <Slider
              value={params.guidanceScale}
              onChange={(v: number) => setParams({ ...params, guidanceScale: v })}
              min={1}
              max={20}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <FormControl>
            <FormLabel>Passos de Inferência ({params.numInferenceSteps})</FormLabel>
            <NumberInput
              value={params.numInferenceSteps}
              onChange={(_: string, v: number) => setParams({ ...params, numInferenceSteps: v })}
              min={1}
              max={150}
              step={1}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Força do Prompt ({params.promptStrength})</FormLabel>
            <Slider
              value={params.promptStrength}
              onChange={(v: number) => setParams({ ...params, promptStrength: v })}
              min={0}
              max={1}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <FormControl>
            <FormLabel>Escala LoRA ({params.loraScale})</FormLabel>
            <Slider
              value={params.loraScale}
              onChange={(v: number) => setParams({ ...params, loraScale: v })}
              min={0}
              max={1}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <FormControl>
            <FormLabel>Proporção</FormLabel>
            <Select
              value={params.aspectRatio}
              onChange={(e) => setParams({ ...params, aspectRatio: e.target.value })}
            >
              <option value="1:1">Quadrado (1:1)</option>
              <option value="3:4">Retrato (3:4)</option>
              <option value="4:3">Paisagem (4:3)</option>
            </Select>
          </FormControl>

          <Button
            onClick={handleGenerate}
            isLoading={loading}
            loadingText="Gerando..."
            colorScheme="blue"
          >
            Gerar Imagem
          </Button>
        </Stack>
      </GridItem>

      <GridItem>
        <Box
          borderWidth={1}
          borderRadius="lg"
          p={6}
          minH="600px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {loading ? (
            <Stack spacing={4}>
              <CircularProgress
                value={progress}
                size="120px"
                thickness="4px"
                color="blue.500"
              >
                <CircularProgressLabel>{progress}%</CircularProgressLabel>
              </CircularProgress>
              <Text>Gerando imagem...</Text>
            </Stack>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt="Imagem gerada"
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
}; 