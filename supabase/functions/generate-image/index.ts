// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, aspect_ratio } = await req.json()
    
    if (!prompt || !aspect_ratio) {
      throw new Error('Prompt e aspect_ratio são obrigatórios')
    }

    const token = Deno.env.get('REPLICATE_API_TOKEN')
    if (!token) {
      throw new Error('Token do Replicate não configurado')
    }

    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "46bbd3d415fa5ec4d2f1a931a0e9c686da9131da6235b81be3d1bb4dca700290",
        input: {
          prompt,
          aspect_ratio,
          model: "dev",
          go_fast: false,
          lora_scale: 1,
          megapixels: "1",
          num_outputs: 1,
          output_format: "webp",
          guidance_scale: 3,
          output_quality: 80,
          prompt_strength: 0.8,
          extra_lora_scale: 1,
          num_inference_steps: 28
        }
      })
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(error.detail || `Erro ao criar predição: ${createResponse.status}`)
    }

    const prediction = await createResponse.json()
    let result = prediction

    // Aguardar até 30 segundos pela geração
    for (let i = 0; i < 30; i++) {
      if (result.status === 'succeeded' || result.status === 'failed') break

      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!pollResponse.ok) {
        throw new Error(`Erro ao verificar status da geração: ${pollResponse.status}`)
      }

      result = await pollResponse.json()
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Falha na geração da imagem')
    }

    if (!result.output?.[0]) {
      throw new Error('Resposta sem URL da imagem')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-image' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
