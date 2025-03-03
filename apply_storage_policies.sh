#!/bin/bash

# Script para aplicar políticas de armazenamento no Supabase
# Requer a CLI do Supabase instalada e configurada

echo "Aplicando políticas de armazenamento para o bucket doc_media no Supabase..."

# Verificar se o arquivo SQL existe
if [ ! -f "./sql/storage_policies.sql" ]; then
  echo "Erro: Arquivo ./sql/storage_policies.sql não encontrado!"
  exit 1
fi

echo "Para aplicar as políticas, você pode:"
echo "1. Copiar o conteúdo do arquivo sql/storage_policies.sql e executá-lo no SQL Editor do Supabase"
echo "2. Ou usar o comando abaixo se você tiver o Supabase CLI instalado:"
echo "   supabase db execute --file=./sql/storage_policies.sql"
echo ""
echo "Importante: Certifique-se de que o bucket 'doc_media' está criado no Storage do Supabase."
echo "O script SQL tentará criar o bucket se ele não existir, mas é melhor verificar manualmente."
echo ""
echo "Após aplicar as políticas, reinicie a aplicação para que as alterações tenham efeito."

# Exibir o conteúdo do arquivo SQL
echo ""
echo "Conteúdo do arquivo SQL:"
echo "------------------------"
cat ./sql/storage_policies.sql
echo "------------------------"

echo ""
echo "Instruções para verificar se as políticas foram aplicadas:"
echo "1. Acesse o painel de administração do Supabase"
echo "2. Vá para 'Storage' > 'Policies'"
echo "3. Verifique se existem políticas para o bucket 'doc_media' que permitem acesso anônimo"
echo ""
echo "Se as políticas não estiverem aplicadas, execute o arquivo SQL manualmente no SQL Editor do Supabase." 