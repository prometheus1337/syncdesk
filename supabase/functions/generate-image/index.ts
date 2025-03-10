// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.syncdesk.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  prompt: string;
  aspectRatio: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio } = await req.json() as RequestBody;
    console.log('Recebido:', { prompt, aspectRatio });

    const token = Deno.env.get('REPLICATE_API_TOKEN');
    if (!token) {
      throw new Error('Token do Replicate não configurado');
    }
    console.log('Token encontrado');

    // Criar predição
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "46bbd3d415fa5ec4d2f1a931a0e9c686da9131da6235b81be3d1bb4dca700290",
        input: {
          model: "dev",
          width: 512,
          height: 512,
          prompt,
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

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('Erro ao criar predição:', error);
      throw new Error(error.detail || 'Erro ao iniciar geração da imagem');
    }

    const prediction = await createResponse.json();
    console.log('Predição criada:', prediction);

    // Aguardar resultado
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 40; // 40 verificações
    const startTime = Date.now();
    const pollInterval = 3000; // 3 segundos entre verificações

    while (attempts < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed') {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      console.log(`Status: ${result.status}, Tentativa: ${attempts + 1}/${maxAttempts}, Tempo decorrido: ${elapsedTime}s`);
      
      if (result.logs) {
        console.log('Logs da predição:', result.logs);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        console.error('Erro ao verificar status:', error);
        throw new Error(error.detail || 'Erro ao verificar status da imagem');
      }

      result = await statusResponse.json();
      attempts++;
    }

    if (result.status === 'failed') {
      console.error('Falha na predição:', result);
      throw new Error(result.error || 'Falha ao gerar imagem');
    }

    if (attempts >= maxAttempts) {
      console.error('Timeout - Último estado:', result);
      throw new Error(`Tempo limite excedido ao gerar imagem. Último status: ${result.status}`);
    }

    console.log('Resultado final:', result);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 