// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const createResponse = await fetch('https://api.replicate.com/v1/deployments/prometheus1337/pvo-gen-ai/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt
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
    const maxAttempts = 30; // 30 segundos

    while (attempts < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed') {
      console.log(`Tentativa ${attempts + 1}/${maxAttempts}, status: ${result.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      throw new Error(result.error || 'Falha ao gerar imagem');
    }

    if (attempts >= maxAttempts) {
      throw new Error('Tempo limite excedido ao gerar imagem');
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