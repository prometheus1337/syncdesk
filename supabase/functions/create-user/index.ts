import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, role, name } = await req.json()

    // Criar usuário na autenticação sem confirmar o email
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false
    })

    if (authError) throw authError

    // Criar perfil do usuário
    const { error: profileError } = await supabaseClient
      .from('app_users')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: name,
          role,
        },
      ])

    if (profileError) throw profileError

    // Enviar email de convite
    const { error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email)

    if (inviteError) throw inviteError

    return new Response(
      JSON.stringify({ user: authData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 