import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Remover qualquer caractere de quebra de linha da chave
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY.replace(/[\n\r%]/g, '');

console.log('Inicializando cliente Supabase com URL:', supabaseUrl);
console.log('Chave do Supabase (primeiros 10 caracteres):', supabaseKey.substring(0, 10) + '...');
console.log('Comprimento da chave:', supabaseKey.length);

// Verificar se a URL e a chave parecem válidas
if (!supabaseUrl || supabaseUrl.length < 10) {
  console.error('ERRO: URL do Supabase parece inválida:', supabaseUrl);
}

if (!supabaseKey || supabaseKey.length < 30) {
  console.error('ERRO: Chave do Supabase parece inválida. Comprimento:', supabaseKey.length);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Testar a conexão com o Supabase
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('ERRO ao conectar com Supabase:', error);
  } else {
    console.log('Conexão com Supabase estabelecida com sucesso. Sessão:', data.session ? 'Ativa' : 'Inativa');
  }
});

// Nome do bucket para armazenar arquivos de documentação
export const DOCS_BUCKET_NAME = 'doc_media';

// Variável para controlar se devemos usar o fallback
let useStorageFallback = false;

// Função para inicializar o storage
export async function initializeStorage() {
  // Se já sabemos que precisamos usar o fallback, não tente novamente
  if (useStorageFallback) {
    console.log('Usando modo fallback para armazenamento');
    return true;
  }
  
  console.log('Iniciando verificação do storage...');
  
  try {
    // Verificar se o bucket existe
    console.log(`Verificando se o bucket ${DOCS_BUCKET_NAME} existe...`);
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError);
      useStorageFallback = true;
      return true;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === DOCS_BUCKET_NAME);
    console.log(`Bucket ${DOCS_BUCKET_NAME} existe? ${bucketExists}`);
    
    if (!bucketExists) {
      console.log(`Bucket ${DOCS_BUCKET_NAME} não encontrado. Tentando criar...`);
      
      // Tentar criar o bucket
      const { data: createData, error: createError } = await supabase
        .storage
        .createBucket(DOCS_BUCKET_NAME, {
          public: true
        });
        
      if (createError) {
        console.error(`Erro ao criar bucket ${DOCS_BUCKET_NAME}:`, createError);
        console.error('Detalhes do erro:', JSON.stringify(createError));
        console.error('Execute o arquivo sql/storage_policies.sql no SQL Editor do Supabase.');
        useStorageFallback = true;
        return true;
      }
      
      console.log(`Bucket ${DOCS_BUCKET_NAME} criado com sucesso:`, createData);
    }
    
    // Testar diretamente o upload de um arquivo pequeno para verificar permissões
    console.log('Testando permissões do bucket com um arquivo de teste...');
    
    // Criar um arquivo de teste pequeno
    const testBlob = new Blob(['teste'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    // Tentar fazer upload do arquivo de teste
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(DOCS_BUCKET_NAME)
      .upload('test_' + Date.now() + '.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Erro ao testar upload:', uploadError);
      console.error('Detalhes do erro:', JSON.stringify(uploadError));
      
      // Verificar se o erro é relacionado a permissões
      if (uploadError.message && (
          uploadError.message.includes('permission') || 
          uploadError.message.includes('not authorized') ||
          uploadError.message.includes('access denied')
        )) {
        console.error('Erro de permissão detectado. Verifique as políticas RLS no Supabase.');
        console.error('Execute o arquivo sql/storage_policies.sql no SQL Editor do Supabase.');
      }
      
      useStorageFallback = true;
      return true; // Retornar true mesmo com erro para não bloquear a aplicação
    }
    
    console.log('Teste de upload bem-sucedido:', uploadData);
    
    // Se chegou até aqui, o bucket existe e temos permissão para upload
    console.log(`Bucket ${DOCS_BUCKET_NAME} está configurado corretamente`);
    return true;
  } catch (error) {
    console.error('Erro ao inicializar storage:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
    useStorageFallback = true;
    return true; // Retornar true mesmo com erro para não bloquear a aplicação
  }
}

// Função para gerar uma URL de placeholder para imagens
export function getPlaceholderImageUrl(file: File): string {
  // Verificar se é uma imagem
  if (file.type.startsWith('image/')) {
    // Gerar uma URL de placeholder com base no nome do arquivo
    const hash = Math.abs(file.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));
    
    // Usar serviços de placeholder de imagem
    return `https://picsum.photos/seed/${hash}/800/600`;
  } 
  // Se for um vídeo
  else if (file.type.startsWith('video/')) {
    return 'https://placehold.co/800x450/333/white?text=Video+Placeholder';
  }
  // Para outros tipos de arquivo
  else {
    return 'https://placehold.co/800x150/333/white?text=File+Attachment';
  }
}

// Função para fazer upload de um arquivo
export async function uploadFile(file: File): Promise<string | null> {
  console.log(`Iniciando upload do arquivo: ${file.name} (${file.size} bytes)`);
  
  try {
    // Verificar a sessão atual
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Status da sessão:', sessionData.session ? 'Autenticado' : 'Não autenticado');
    
    // Tentar fazer upload para o Supabase
    try {
      // Gerar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      // Adicionar o prefixo 'media/' ao caminho do arquivo
      const filePath = `media/${fileName}`;
      
      console.log(`Nome gerado para o arquivo: ${filePath}`);
      
      // Verificar se a pasta 'media' existe e criar se necessário
      try {
        // Listar arquivos na pasta media para verificar se ela existe
        const { data: mediaFolderCheck, error: mediaFolderError } = await supabase
          .storage
          .from(DOCS_BUCKET_NAME)
          .list('media');
          
        if (mediaFolderError) {
          console.log('Pasta media pode não existir, tentando criar com um arquivo temporário...');
          // Criar um arquivo temporário para garantir que a pasta exista
          const tempFile = new Blob([''], { type: 'text/plain' });
          await supabase
            .storage
            .from(DOCS_BUCKET_NAME)
            .upload('media/.folder', tempFile);
            
          console.log('Pasta media criada ou verificada com sucesso');
        } else {
          console.log('Pasta media já existe:', mediaFolderCheck);
        }
      } catch (folderError) {
        console.warn('Erro ao verificar/criar pasta media:', folderError);
        // Continuar mesmo com erro, pois o upload pode funcionar de qualquer forma
      }
      
      // Tentar fazer upload usando a API do Supabase
      console.log(`Tentando upload para o bucket ${DOCS_BUCKET_NAME} na pasta media...`);
      const { data, error } = await supabase
        .storage
        .from(DOCS_BUCKET_NAME)
        .upload(filePath, file);
      
      if (error) {
        console.error('Erro ao fazer upload para o Supabase:', error);
        throw error;
      }
      
      console.log('Upload para o Supabase concluído com sucesso:', data);
      
      // Obter a URL pública do arquivo
      console.log('Obtendo URL pública do arquivo...');
      const { data: urlData } = supabase
        .storage
        .from(DOCS_BUCKET_NAME)
        .getPublicUrl(filePath);
      
      console.log('URL pública obtida:', urlData.publicUrl);
      
      return urlData.publicUrl;
    } catch (supabaseError) {
      console.error('Falha no upload para o Supabase, usando fallback local:', supabaseError);
      
      // Usar fallback local - gerar URL de placeholder
      console.log('Gerando URL de placeholder para o arquivo...');
      const placeholderUrl = getPlaceholderImageUrl(file);
      console.log('URL de placeholder gerada:', placeholderUrl);
      
      // Exibir alerta sobre o uso de fallback
      alert('Não foi possível fazer upload para o servidor. Uma imagem de placeholder será usada temporariamente. Por favor, configure o bucket "doc_media" no Supabase e as políticas de acesso para uploads permanentes.');
      
      return placeholderUrl;
    }
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
    throw error;
  }
} 