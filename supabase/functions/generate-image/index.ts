import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RequestBody {
  prompt: string;
  aspectRatio: string;
}

serve(async (req) => {
  // Habilitar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { prompt, aspectRatio } = await req.json() as RequestBody;

    // Criar predição no Replicate
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "46bbd3d415fa5ec4d2f1a931a0e9c686da9131da6235b81be3d1bb4dca700290",
        input: {
          model: "dev",
          prompt: prompt,
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
      const error = await createResponse.text();
      throw new Error(`Erro na API do Replicate: ${error}`);
    }

    const result = await createResponse.json();

    // Se não tiver URL de status, retorna erro
    if (!result.urls?.get) {
      throw new Error('URL de status não encontrada');
    }

    // Aguardar até a imagem estar pronta
    const statusUrl = result.urls.get;
    while (true) {
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('REPLICATE_API_TOKEN')}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Erro ao verificar status');
      }

      const statusResult = await statusResponse.json();

      if (statusResult.status === 'succeeded') {
        return new Response(JSON.stringify({
          url: statusResult.output[0]
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else if (statusResult.status === 'failed') {
        throw new Error(`Falha ao gerar imagem: ${statusResult.error || 'Erro desconhecido'}`);
      } else if (statusResult.status === 'canceled') {
        throw new Error('Geração de imagem cancelada');
      }

      // Aguarda 1 segundo antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 