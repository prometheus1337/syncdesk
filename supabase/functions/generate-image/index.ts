import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RequestBody {
  prompt: string;
  aspect_ratio: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, aspect_ratio } = await req.json() as RequestBody;

    // Criar a predição
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('REPLICATE_API_TOKEN')}`,
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
          aspect_ratio,
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
      const error = await createResponse.json();
      throw new Error(error.detail || 'Erro ao criar predição');
    }

    const prediction = await createResponse.json();
    console.log('Predição criada:', prediction);

    // Aguardar a conclusão da geração
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('REPLICATE_API_TOKEN')}`,
        },
      });

      if (!pollResponse.ok) {
        throw new Error('Erro ao verificar status da geração');
      }

      result = await pollResponse.json();
      console.log('Status atual:', result.status);
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Falha na geração da imagem');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 