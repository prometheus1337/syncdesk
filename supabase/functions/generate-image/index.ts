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

    const response = await fetch('https://api.replicate.com/v1/deployments/prometheus1337/pvo-gen-ai/predictions', {
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

    console.log('Status da resposta:', response.status);
    if (!response.ok) {
      const error = await response.json();
      console.error('Erro Replicate:', error);
      throw new Error(JSON.stringify(error) || 'Erro ao gerar imagem');
    }

    const prediction = await response.json();
    console.log('Prediction inicial:', prediction);
    
    // Aguardar até a predição estar completa
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
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
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Falha ao gerar imagem');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 