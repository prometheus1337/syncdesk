import { useEffect, useState } from "react";
import { Box, Flex, Heading, Text, Card, CardBody, Stack, Spinner, useToast, Input, InputGroup, InputLeftElement, Divider, Link as ChakraLink, useColorModeValue, IconButton, Button } from "@chakra-ui/react";
import { SearchIcon, EditIcon, ChevronRightIcon, ChevronDownIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import "./markdown-styles.css";

// Componente para renderizar vídeos no markdown
const VideoRenderer = ({ node, ...props }: any) => {
  return (
    <Box my={4}>
      <video 
        controls 
        width="100%" 
        style={{ maxWidth: '100%', borderRadius: '8px' }} 
        {...props} 
      />
    </Box>
  );
};

// Componente para renderizar imagens no markdown com estilo melhorado
const ImageRenderer = ({ node, ...props }: any) => {
  const [error, setError] = useState(false);
  
  // Função para lidar com erros de carregamento de imagem
  const handleError = () => {
    console.error(`Erro ao carregar imagem: ${props.src}`);
    setError(true);
  };
  
  // Se houver erro, mostrar uma imagem de fallback
  if (error) {
    return (
      <Box my={4} textAlign="center">
        <Box 
          width="100%" 
          height="200px" 
          bg="gray.200" 
          borderRadius="8px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Text color="gray.500" mb={2}>Imagem não disponível</Text>
          <Text fontSize="sm" color="gray.400">{props.alt || 'Erro ao carregar imagem'}</Text>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box my={4} textAlign="center">
      <img 
        style={{ 
          maxWidth: '100%', 
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }} 
        onError={handleError}
        {...props} 
      />
      {props.alt && <Text fontSize="sm" color="gray.500" mt={1}>{props.alt}</Text>}
    </Box>
  );
};

interface DocSection {
  id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

interface DocItem {
  id: string;
  section_id: string;
  title: string;
  content: string;
  order: number;
  parent_id: string | null;
  created_at: string;
}

export function DocsViewer() {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<DocSection | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocs, setFilteredDocs] = useState<DocItem[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, title: string}[]>([]);
  const toast = useToast();
  const { appUser } = useAuth();
  
  // Cores
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBgColor = useColorModeValue('gray.50', 'gray.900');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeBgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    fetchSections();
    fetchAllDocs();
    
    // Configurar um intervalo para atualizar os documentos a cada 5 segundos
    const refreshInterval = setInterval(() => {
      if (!isLoading) { // Evitar múltiplas requisições simultâneas
        console.log('DocsViewer: Atualizando documentos automaticamente');
        fetchAllDocs();
        fetchSections();
      }
    }, 5000); // 5 segundos
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocs([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults = docs.filter(
      doc => doc.title.toLowerCase().includes(query) || doc.content.toLowerCase().includes(query)
    );
    setFilteredDocs(searchResults);
  }, [searchQuery, docs]);

  async function fetchSections() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('doc_sections')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      toast({
        title: 'Erro ao carregar seções',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    setSections(data || []);
    setIsLoading(false);
  }

  async function fetchAllDocs() {
    setIsLoading(true);
    console.log('DocsViewer: Carregando todos os documentos');
    const { data, error } = await supabase
      .from('doc_items')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('DocsViewer: Erro ao carregar documentos:', error);
      toast({
        title: 'Erro ao carregar documentos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    console.log('DocsViewer: Documentos carregados:', data?.length || 0, 'documentos');
    // Garantir que os documentos estejam ordenados corretamente
    const sortedData = data ? [...data].sort((a, b) => a.order - b.order) : [];
    console.log('DocsViewer: Documentos ordenados:', sortedData.map(d => `${d.title} (ordem: ${d.order})`));
    setDocs(sortedData);
    setIsLoading(false);
  }

  async function handleSectionClick(section: DocSection) {
    setSelectedSection(section);
    setSelectedDoc(null);
    setBreadcrumbs([{id: section.id, title: section.title}]);
  }

  async function handleDocClick(doc: DocItem) {
    setSelectedDoc(doc);
    
    // Atualizar breadcrumbs
    if (selectedSection) {
      const newBreadcrumbs = [{id: selectedSection.id, title: selectedSection.title}];
      
      // Se o documento tem um pai, adicionar os pais ao breadcrumb
      if (doc.parent_id) {
        const parentDocs = await getParentDocsChain(doc.parent_id);
        newBreadcrumbs.push(...parentDocs.map(d => ({id: d.id, title: d.title})));
      }
      
      // Adicionar o documento atual
      newBreadcrumbs.push({id: doc.id, title: doc.title});
      setBreadcrumbs(newBreadcrumbs);
    }
  }
  
  // Função para obter a cadeia de documentos pais
  async function getParentDocsChain(parentId: string): Promise<DocItem[]> {
    const result: DocItem[] = [];
    let currentParentId = parentId;
    
    while (currentParentId) {
      const { data, error } = await supabase
        .from('doc_items')
        .select('*')
        .eq('id', currentParentId)
        .single();
        
      if (error || !data) break;
      
      result.unshift(data);
      currentParentId = data.parent_id;
    }
    
    return result;
  }
  
  // Função para lidar com cliques no breadcrumb
  function handleBreadcrumbClick(item: {id: string, title: string}, index: number) {
    // Truncar breadcrumbs até o índice clicado
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    
    // Se for o primeiro item (seção), mostrar a seção
    if (index === 0) {
      const section = sections.find(s => s.id === item.id);
      if (section) {
        setSelectedSection(section);
        setSelectedDoc(null);
      }
    } else {
      // Se for um documento, mostrar o documento
      const doc = docs.find(d => d.id === item.id);
      if (doc) {
        setSelectedDoc(doc);
      }
    }
  }

  function toggleDocExpand(docId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  }
  
  function hasChildren(docId: string): boolean {
    return docs.some(doc => doc.parent_id === docId);
  }

  if (!appUser) {
    return (
      <Card>
        <CardBody>
          <Text>Você precisa estar logado para acessar esta página.</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box maxW="100%" mx="auto">
      <Flex direction="column" minH="calc(100vh - 150px)">
        {/* Header com título e busca */}
        <Flex 
          p={4} 
          borderBottom="1px" 
          borderColor={borderColor} 
          bg={bgColor} 
          justifyContent="space-between"
          alignItems="center"
          boxShadow="sm"
        >
          <Flex alignItems="center">
            <Heading size="md" color={textColor}>Documentação e instruções</Heading>
          </Flex>
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Buscar" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
              size="sm"
            />
          </InputGroup>
        </Flex>

        <Flex flex="1">
          {/* Sidebar com navegação */}
          <Box 
            w="280px" 
            borderRight="1px" 
            borderColor={borderColor} 
            bg={sidebarBgColor}
            overflowY="auto"
            p={0}
          > 
            {/* Renderizar as seções do banco de dados */}
            <Box p={4}>
              {sections.map((section) => (
                <Box key={section.id} mb={6}>
                  <Text 
                    fontWeight="bold" 
                    fontSize="sm" 
                    color={mutedTextColor} 
                    mb={3}
                    cursor="pointer"
                    onClick={() => handleSectionClick(section)}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {section.title}
                  </Text>
                  <Box>
                    {docs
                      .filter(doc => doc.section_id === section.id && !doc.parent_id)
                      .sort((a, b) => a.order - b.order)
                      .map((doc) => (
                        <Box key={doc.id} mb={1}>
                          <Flex alignItems="center">
                            {hasChildren(doc.id) ? (
                              <IconButton
                                aria-label={expandedDocs[doc.id] ? "Recolher" : "Expandir"}
                                icon={expandedDocs[doc.id] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                size="xs"
                                variant="ghost"
                                onClick={(e) => toggleDocExpand(doc.id, e)}
                                mr={1}
                                color={mutedTextColor}
                              />
                            ) : (
                              <Box w="20px" />
                            )}
                            <ChakraLink
                              display="block"
                              py={1}
                              px={2}
                              borderRadius="md"
                              bg={selectedDoc?.id === doc.id ? activeBgColor : 'transparent'}
                              _hover={{ bg: hoverBgColor }}
                              onClick={() => handleDocClick(doc)}
                              fontWeight={selectedDoc?.id === doc.id ? "semibold" : "normal"}
                              fontSize="sm"
                              flex="1"
                              color={selectedDoc?.id === doc.id ? "blue.600" : textColor}
                            >
                              {doc.title}
                            </ChakraLink>
                          </Flex>
                          
                          {hasChildren(doc.id) && expandedDocs[doc.id] && (
                            <Box pl={6} mt={1} borderLeft="1px" borderColor="gray.200">
                              {docs
                                .filter(childDoc => childDoc.parent_id === doc.id)
                                .sort((a, b) => a.order - b.order)
                                .map(childDoc => (
                                  <Box key={childDoc.id} mb={1}>
                                    <Flex alignItems="center">
                                      {hasChildren(childDoc.id) ? (
                                        <IconButton
                                          aria-label={expandedDocs[childDoc.id] ? "Recolher" : "Expandir"}
                                          icon={expandedDocs[childDoc.id] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={(e) => toggleDocExpand(childDoc.id, e)}
                                          mr={1}
                                          color={mutedTextColor}
                                        />
                                      ) : (
                                        <Box w="20px" />
                                      )}
                                      <ChakraLink
                                        display="block"
                                        py={1}
                                        px={2}
                                        borderRadius="md"
                                        bg={selectedDoc?.id === childDoc.id ? activeBgColor : 'transparent'}
                                        _hover={{ bg: hoverBgColor }}
                                        onClick={() => handleDocClick(childDoc)}
                                        fontWeight={selectedDoc?.id === childDoc.id ? "semibold" : "normal"}
                                        fontSize="sm"
                                        flex="1"
                                        color={selectedDoc?.id === childDoc.id ? "blue.600" : textColor}
                                      >
                                        {childDoc.title}
                                      </ChakraLink>
                                    </Flex>
                                    
                                    {hasChildren(childDoc.id) && expandedDocs[childDoc.id] && (
                                      <Box pl={6} mt={1} borderLeft="1px" borderColor="gray.200">
                                        {docs
                                          .filter(grandChildDoc => grandChildDoc.parent_id === childDoc.id)
                                          .sort((a, b) => a.order - b.order)
                                          .map(grandChildDoc => (
                                            <Flex key={grandChildDoc.id} alignItems="center" mb={1}>
                                              <ChakraLink
                                                display="block"
                                                py={1}
                                                px={2}
                                                borderRadius="md"
                                                bg={selectedDoc?.id === grandChildDoc.id ? activeBgColor : 'transparent'}
                                                _hover={{ bg: hoverBgColor }}
                                                onClick={() => handleDocClick(grandChildDoc)}
                                                fontWeight={selectedDoc?.id === grandChildDoc.id ? "semibold" : "normal"}
                                                fontSize="sm"
                                                flex="1"
                                                color={selectedDoc?.id === grandChildDoc.id ? "blue.600" : textColor}
                                              >
                                                {grandChildDoc.title}
                                              </ChakraLink>
                                            </Flex>
                                          ))}
                                      </Box>
                                    )}
                                  </Box>
                                ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Conteúdo principal */}
          <Box flex="1" overflowY="auto" p={8} bg={bgColor}>
            {isLoading ? (
              <Flex justifyContent="center" py={10}>
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : searchQuery.trim() !== '' ? (
              // Resultados da busca
              <Box>
                <Heading size="md" mb={4}>Resultados da busca: {filteredDocs.length} documento(s) encontrado(s)</Heading>
                {filteredDocs.length > 0 ? (
                  <Stack spacing={4}>
                    {filteredDocs.map(doc => (
                      <Card key={doc.id} variant="outline" cursor="pointer" onClick={() => handleDocClick(doc)}>
                        <CardBody>
                          <Heading size="sm" mb={2}>{doc.title}</Heading>
                          <Text noOfLines={2}>{doc.content.replace(/[#*`]/g, '')}</Text>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Text>Nenhum resultado encontrado para "{searchQuery}"</Text>
                )}
              </Box>
            ) : (
              <Box maxW="800px">
                {/* Conteúdo do documento */}
                {selectedDoc ? (
                  <Box p={6}>
                    <Button
                      leftIcon={<ArrowBackIcon />}
                      size="sm"
                      variant="outline"
                      mb={8}
                      onClick={() => {
                        if (breadcrumbs.length > 1) {
                          // Voltar para o documento anterior
                          const previousItem = breadcrumbs[breadcrumbs.length - 2];
                          handleBreadcrumbClick(previousItem, breadcrumbs.length - 2);
                        } else {
                          // Voltar para a seção
                          setSelectedDoc(null);
                        }
                      }}
                    >
                      Voltar
                    </Button>
                    <Box mb={6}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Heading size="lg">{selectedDoc.title}</Heading>
                        {appUser?.role === 'admin' && (
                          <IconButton
                            aria-label="Editar documento"
                            icon={<EditIcon />}
                            size="sm"
                            variant="ghost"
                            as={Link}
                            to={`/docs/edit/${selectedDoc.id}`}
                          />
                        )}
                      </Flex>
                    </Box>
                    <Box className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ImageRenderer,
                          video: VideoRenderer
                        }}
                      >
                        {selectedDoc.content}
                      </ReactMarkdown>
                    </Box>
                  </Box>
                ) : selectedSection ? (
                  <Box>
                    <Heading size="lg" mb={2}>{selectedSection.title}</Heading>
                    <Text color="gray.600" mb={6}>{selectedSection.description}</Text>
                    <Divider mb={6} />
                    {docs.length > 0 ? (
                      <Stack spacing={4}>
                        {docs.map(doc => (
                          <Card key={doc.id} variant="outline" cursor="pointer" onClick={() => handleDocClick(doc)}>
                            <CardBody>
                              <Heading size="md" mb={2}>{doc.title}</Heading>
                              <Text noOfLines={2}>{doc.content.replace(/[#*`]/g, '')}</Text>
                            </CardBody>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Text>Nenhum documento encontrado nesta seção.</Text>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Heading size="xl" mb={4}>Documentação</Heading>
                    <Text mb={6}>Selecione uma seção no menu lateral para começar.</Text>
                    <Divider mb={6} />
                    <Stack spacing={4}>
                      {sections.map(section => (
                        <Card key={section.id} variant="outline" cursor="pointer" onClick={() => handleSectionClick(section)}>
                          <CardBody>
                            <Heading size="md" mb={2}>{section.title}</Heading>
                            <Text>{section.description}</Text>
                          </CardBody>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
} 