import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Card,
  CardBody,
  Stack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  useToast,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  Select,
  IconButton,
  Tooltip,
  VStack,
  Textarea,
  useColorModeValue,
  ButtonGroup,
  Divider,
} from '@chakra-ui/react';
import { ChevronRightIcon, AddIcon, EditIcon, DeleteIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { supabase, initializeStorage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Editor } from '@tinymce/tinymce-react';
import "./markdown-styles.css";

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

// Definir tipo para breadcrumb item
type BreadcrumbItem = {
  id: string;
  title: string;
  type: 'section' | 'doc';
};

export function DocsHub() {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<DocSection | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { isOpen: isSectionModalOpen, onOpen: onSectionModalOpen, onClose: onSectionModalClose } = useDisclosure();
  const { isOpen: isDocModalOpen, onOpen: onDocModalOpen, onClose: onDocModalClose } = useDisclosure();
  const [newSection, setNewSection] = useState<Partial<DocSection>>({ title: '', description: '' });
  const [newDoc, setNewDoc] = useState<Partial<DocItem>>({ title: '', content: '', section_id: '', parent_id: null });
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();
  const { appUser } = useAuth();
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [orphanDocs, setOrphanDocs] = useState<DocItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Cores
  const textColor = useColorModeValue('gray.800', 'white');
  const editorBorderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Carregar dados iniciais
    fetchSections();
    
    // Se houver um ID de documento na URL, carregar para edição
    if (docId) {
      loadDocumentForEditing(docId);
    }
    
    // Carregar documentos órfãos para administradores
    if (appUser?.role === 'admin') {
      fetchOrphanDocs();
    }

    // Inicializar o bucket de armazenamento ao carregar o componente
    console.log('Iniciando inicialização do armazenamento...');
    initializeStorage().then(success => {
      console.log('Resultado da inicialização do armazenamento:', success);
      // Não exibir toast por padrão, apenas se houver erro
    }).catch(error => {
      console.error('Erro ao inicializar armazenamento:', error);
      toast({
        title: 'Erro no armazenamento',
        description: 'Ocorreu um erro ao configurar o armazenamento. Usando imagens de placeholder.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    });
  }, [docId, appUser]);

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

  async function fetchDocs(sectionId: string, parentId: string | null = null) {
    setIsLoading(true);
    console.log('DocsHub: Carregando documentos para seção', sectionId, 'e parentId', parentId);
    
    // Carregar todos os documentos da seção, independente do parentId
    const { data, error } = await supabase
      .from('doc_items')
      .select('*')
      .eq('section_id', sectionId)
      .order('order', { ascending: true });

    if (error) {
      console.error('DocsHub: Erro ao carregar documentos:', error);
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

    // Garantir que os documentos estejam ordenados corretamente
    const sortedData = data ? [...data].sort((a, b) => a.order - b.order) : [];
    console.log('DocsHub: Documentos carregados e ordenados:', 
      sortedData.map(d => `${d.title} (ordem: ${d.order})`));
    
    setDocs(sortedData);
    setIsLoading(false);
  }

  async function handleSectionClick(section: DocSection) {
    setSelectedSection(section);
    setSelectedDoc(null);
    setBreadcrumbs([{ id: section.id, title: section.title, type: 'section' }]);
    await fetchDocs(section.id);
  }

  async function handleDocClick(doc: DocItem) {
    setSelectedDoc(doc);
    
    // Atualizar breadcrumbs
    if (selectedSection) {
      const newBreadcrumbs: BreadcrumbItem[] = [{ id: selectedSection.id, title: selectedSection.title, type: 'section' }];
      
      // Se tiver parent_id, precisamos adicionar todos os pais no breadcrumb
      if (doc.parent_id) {
        const parentDocs = await getParentDocs(doc.parent_id);
        parentDocs.forEach(d => {
          newBreadcrumbs.push({ id: d.id, title: d.title, type: 'doc' });
        });
      }
      
      newBreadcrumbs.push({ id: doc.id, title: doc.title, type: 'doc' });
      setBreadcrumbs(newBreadcrumbs);
    }
    
    // Não precisamos mais recarregar os documentos aqui, pois já carregamos todos
  }

  async function getParentDocs(parentId: string): Promise<DocItem[]> {
    const { data } = await supabase
      .from('doc_items')
      .select('*')
      .eq('id', parentId)
      .single();
    
    if (!data) return [];
    
    const parents = [];
    if (data.parent_id) {
      const parentDocs = await getParentDocs(data.parent_id);
      parents.push(...parentDocs);
    }
    
    parents.push(data);
    return parents;
  }

  async function handleBreadcrumbClick(item: BreadcrumbItem, index: number) {
    // Atualizar breadcrumbs até o item clicado
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    
    if (item.type === 'section') {
      setSelectedSection(sections.find(s => s.id === item.id) || null);
      setSelectedDoc(null);
      await fetchDocs(item.id);
    } else {
      const doc = await supabase
        .from('doc_items')
        .select('*')
        .eq('id', item.id)
        .single();
      
      if (doc.data) {
        setSelectedDoc(doc.data);
        await fetchDocs(doc.data.section_id, doc.data.id);
      }
    }
  }

  async function handleSaveSection() {
    setIsLoading(true);
    
    try {
      if (isEditing && newSection.id) {
        // Atualizar seção existente
        const { error } = await supabase
          .from('doc_sections')
          .update({
            title: newSection.title,
            description: newSection.description,
          })
          .eq('id', newSection.id);
        
        if (error) throw error;
        
        toast({
          title: 'Seção atualizada',
          status: 'success',
          duration: 2000,
        });
      } else {
        // Criar nova seção
        const { data: lastSection } = await supabase
          .from('doc_sections')
          .select('order')
          .order('order', { ascending: false })
          .limit(1);
        
        const nextOrder = lastSection && lastSection.length > 0 ? lastSection[0].order + 1 : 1;
        
        const { error } = await supabase
          .from('doc_sections')
          .insert({
            title: newSection.title,
            description: newSection.description,
            order: nextOrder,
          });
        
        if (error) throw error;
        
        toast({
          title: 'Seção criada',
          status: 'success',
          duration: 2000,
        });
      }
      
      // Recarregar seções
      await fetchSections();
      onSectionModalClose();
      setNewSection({ title: '', description: '' });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar seção',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    setIsLoading(false);
  }

  async function handleSaveDoc() {
    setIsLoading(true);
    console.log('Iniciando salvamento do documento:', newDoc);
    
    try {
      // Verificar o token JWT atual
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Token JWT disponível:', !!session?.access_token);
      console.log('Papel do usuário:', appUser?.role);
      
      if (isEditing && newDoc.id) {
        // Atualizar documento existente
        console.log('Atualizando documento existente:', newDoc.id);
        const { data, error } = await supabase
          .from('doc_items')
          .update({
            title: newDoc.title,
            content: newDoc.content,
            section_id: newDoc.section_id,
            parent_id: newDoc.parent_id,
          })
          .eq('id', newDoc.id)
          .select();
        
        console.log('Resposta da atualização:', { data, error });
        
        if (error) throw error;
        
        toast({
          title: 'Documento atualizado',
          status: 'success',
          duration: 2000,
        });
      } else {
        // Criar novo documento
        console.log('Criando novo documento');
        const { data: lastDoc, error: orderError } = await supabase
          .from('doc_items')
          .select('order')
          .eq('section_id', newDoc.section_id)
          .eq('parent_id', newDoc.parent_id || null)
          .order('order', { ascending: false })
          .limit(1);
        
        console.log('Último documento para ordem:', lastDoc, orderError);
        
        const nextOrder = lastDoc && lastDoc.length > 0 ? lastDoc[0].order + 1 : 1;
        
        const { data, error } = await supabase
          .from('doc_items')
          .insert({
            title: newDoc.title,
            content: newDoc.content,
            section_id: newDoc.section_id,
            parent_id: newDoc.parent_id,
            order: nextOrder,
          })
          .select();
        
        console.log('Resposta da inserção:', { data, error });
        
        if (error) throw error;
        
        toast({
          title: 'Documento criado',
          status: 'success',
          duration: 2000,
        });
      }
      
      // Recarregar documentos - Modificado para garantir que os documentos sejam atualizados
      console.log('Recarregando documentos após salvamento');
      
      // Forçar uma nova busca direta do documento que acabamos de salvar
      if (isEditing && newDoc.id) {
        console.log('Buscando documento atualizado diretamente:', newDoc.id);
        const { data: updatedDoc, error: fetchError } = await supabase
          .from('doc_items')
          .select('*')
          .eq('id', newDoc.id)
          .single();
          
        console.log('Documento buscado após atualização:', updatedDoc, fetchError);
        
        if (updatedDoc) {
          setSelectedDoc(updatedDoc);
        }

      }
      
      if (selectedSection) {
        console.log('Recarregando documentos da seção selecionada:', selectedSection.id);
        await fetchDocs(selectedSection.id, selectedDoc?.id || null);
      } else if (newDoc.section_id) {
        // Se não houver seção selecionada, mas temos a seção do documento
        console.log('Recarregando documentos da seção do documento:', newDoc.section_id);
        await fetchDocs(newDoc.section_id, newDoc.parent_id);
      }
      
      onDocModalClose();
      setNewDoc({ title: '', content: '', section_id: selectedSection?.id || '', parent_id: selectedDoc?.id || null });
      setIsEditing(false);
      console.log('Salvamento concluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao salvar documento:', error);
      toast({
        title: 'Erro ao salvar documento',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    setIsLoading(false);
  }

  function handleEditSection(section: DocSection) {
    setNewSection(section);
    setIsEditing(true);
    onSectionModalOpen();
  }

  function handleEditDoc(doc: DocItem) {
    setNewDoc(doc);
    setIsEditing(true);
    onDocModalOpen();
  }

  async function handleDeleteSection(id: string) {
    if (window.confirm('Tem certeza que deseja excluir esta seção? Os documentos serão preservados como "sem seção".')) {
      setIsLoading(true);
      
      try {
        // Buscar todos os documentos da seção
        const { data: sectionDocs } = await supabase
          .from('doc_items')
          .select('*')
          .eq('section_id', id);
        
        if (sectionDocs && sectionDocs.length > 0) {
          // Primeiro, verificar se existe alguma seção para mover os documentos
          const { data: otherSections } = await supabase
            .from('doc_sections')
            .select('id')
            .neq('id', id)
            .limit(1);
            
          let targetSectionId = null;
          
          if (otherSections && otherSections.length > 0) {
            // Se existir outra seção, mover os documentos para ela
            targetSectionId = otherSections[0].id;
            
            // Atualizar os documentos para a nova seção
            const { error: updateError } = await supabase
              .from('doc_items')
              .update({ section_id: targetSectionId })
              .eq('section_id', id);
            
            if (updateError) {
              throw updateError;
            }
            
            console.log(`${sectionDocs.length} documentos movidos para outra seção`);
          } else {
            // Se não existir outra seção, precisamos criar uma temporária
            const { data: newSection, error: createError } = await supabase
              .from('doc_sections')
              .insert({
                title: 'Documentos sem categoria',
                description: 'Documentos de seções excluídas',
                order: 999
              })
              .select();
              
            if (createError) {
              throw createError;
            }
            
            targetSectionId = newSection[0].id;
            
            // Atualizar os documentos para a nova seção
            const { error: updateError } = await supabase
              .from('doc_items')
              .update({ section_id: targetSectionId })
              .eq('section_id', id);
            
            if (updateError) {
              throw updateError;
            }
            
            console.log(`${sectionDocs.length} documentos movidos para seção temporária`);
          }
        }
        
        // Excluir a seção
        const { error } = await supabase
          .from('doc_sections')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Atualizar a interface
        setSelectedSection(null);
        setSelectedDoc(null);
        setBreadcrumbs([]);
        fetchSections();
        fetchOrphanDocs(); // Recarregar documentos órfãos
        
        toast({
          title: 'Seção excluída',
          description: 'A seção foi excluída com sucesso e seus documentos foram preservados.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error: any) {
        console.error('Erro ao excluir seção:', error);
        toast({
          title: 'Erro ao excluir seção',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm('Tem certeza que deseja excluir este documento? Todos os subdocumentos serão excluídos.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Função recursiva para excluir documento e seus filhos
      async function deleteDocAndChildren(docId: string) {
        // Buscar filhos
        const { data: children } = await supabase
          .from('doc_items')
          .select('id')
          .eq('parent_id', docId);
        
        // Excluir filhos recursivamente
        if (children && children.length > 0) {
          for (const child of children) {
            await deleteDocAndChildren(child.id);
          }
        }
        
        // Excluir o documento atual
        const { error } = await supabase
          .from('doc_items')
          .delete()
          .eq('id', docId);
        
        if (error) throw error;
      }
      
      await deleteDocAndChildren(id);
      
      toast({
        title: 'Documento excluído',
        status: 'success',
        duration: 2000,
      });
      
      // Recarregar documentos
      if (selectedSection) {
        await fetchDocs(selectedSection.id, selectedDoc?.id === id ? null : selectedDoc?.id || null);
      }
      
      // Limpar seleção se necessário
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        // Ajustar breadcrumbs
        if (breadcrumbs.length > 1) {
          const newBreadcrumbs = [...breadcrumbs];
          newBreadcrumbs.pop();
          setBreadcrumbs(newBreadcrumbs);
          
          // Se o último item for um documento, selecionar ele
          const lastItem = newBreadcrumbs[newBreadcrumbs.length - 1];
          if (lastItem.type === 'doc') {
            const { data } = await supabase
              .from('doc_items')
              .select('*')
              .eq('id', lastItem.id)
              .single();
            
            if (data) {
              setSelectedDoc(data);
              await fetchDocs(data.section_id, data.id);
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir documento',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    setIsLoading(false);
  }

  function handleAddSection() {
    setNewSection({ title: '', description: '' });
    setIsEditing(false);
    onSectionModalOpen();
  }

  function handleAddDoc() {
    setNewDoc({
      title: '',
      content: '',
      section_id: selectedSection?.id || '',
      parent_id: selectedDoc?.id || null,
    });
    setIsEditing(false);
    onDocModalOpen();
  }

  async function loadDocumentForEditing(id: string) {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('doc_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Carregar a seção do documento
        const { data: sectionData } = await supabase
          .from('doc_sections')
          .select('*')
          .eq('id', data.section_id)
          .single();
        
        if (sectionData) {
          setSelectedSection(sectionData);
          setBreadcrumbs([{ id: sectionData.id, title: sectionData.title, type: 'section' }]);
          
          // Carregar documentos da seção
          await fetchDocs(data.section_id, data.parent_id);
          
          // Selecionar o documento
          setSelectedDoc(data);
          
          // Configurar para edição
          setNewDoc(data);
          setIsEditing(true);
          onDocModalOpen();
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar documento',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    setIsLoading(false);
  }

  // Modificar o onDocModalClose para redirecionar se veio da URL
  const handleDocModalClose = () => {
    onDocModalClose();
    if (docId) {
      navigate('/docs/admin');
    }
  };

  function toggleDocExpand(docId: string, e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  }
  
  function hasChildren(docId: string): boolean {
    return docs.some(doc => doc.parent_id === docId);
  }

  async function moveSection(sectionId: string, direction: 'up' | 'down') {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    // Se estiver tentando mover para cima e já estiver no topo, ou
    // se estiver tentando mover para baixo e já estiver no final, não faça nada
    if ((direction === 'up' && sectionIndex === 0) || 
        (direction === 'down' && sectionIndex === sections.length - 1)) {
      return;
    }
    
    // Criar uma cópia do array de seções
    const reorderedSections = [...sections];
    
    // Calcular o novo índice
    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    // Trocar as posições
    [reorderedSections[sectionIndex], reorderedSections[newIndex]] = [reorderedSections[newIndex], reorderedSections[sectionIndex]];
    
    // Atualizar o estado
    setSections(reorderedSections);
    
    // Atualizar a ordem no banco de dados
    try {
      // Atualizar a ordem de cada seção para garantir que sejam sequenciais
      const updatePromises = reorderedSections.map((section, index) => {
        return supabase
          .from('doc_sections')
          .update({ "order": index + 1 })
          .eq('id', section.id);
      });
      
      await Promise.all(updatePromises);
      
      // Recarregar as seções para garantir que estão atualizadas
      await fetchSections();
    } catch (error) {
      console.error('Erro ao atualizar ordem das seções:', error);
      // Em caso de erro, reverter as alterações locais
      fetchSections();
    }
  }

  async function moveDoc(docId: string, direction: 'up' | 'down') {
    if (!selectedSection) return;
    
    // Filtrar documentos do mesmo nível (mesma seção e mesmo pai)
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    
    const sameLevelDocs = docs.filter(d => 
      d.section_id === doc.section_id && 
      d.parent_id === doc.parent_id
    ).sort((a, b) => a.order - b.order);
    
    const docIndex = sameLevelDocs.findIndex(d => d.id === docId);
    if (docIndex === -1) return;
    
    // Se estiver tentando mover para cima e já estiver no topo, ou
    // se estiver tentando mover para baixo e já estiver no final, não faça nada
    if ((direction === 'up' && docIndex === 0) || 
        (direction === 'down' && docIndex === sameLevelDocs.length - 1)) {
      return;
    }
    
    // Calcular o novo índice
    const newIndex = direction === 'up' ? docIndex - 1 : docIndex + 1;
    
    // Trocar as posições
    const reorderedDocs = [...sameLevelDocs];
    [reorderedDocs[docIndex], reorderedDocs[newIndex]] = [reorderedDocs[newIndex], reorderedDocs[docIndex]];
    
    // Atualizar o estado local primeiro com a nova ordenação
    const updatedAllDocs = [...docs];
    
    // Atualizar as ordens de todos os documentos do mesmo nível
    reorderedDocs.forEach((d, index) => {
      // Atualizar a ordem no array local
      const docIndex = updatedAllDocs.findIndex(doc => doc.id === d.id);
      if (docIndex !== -1) {
        updatedAllDocs[docIndex] = {
          ...updatedAllDocs[docIndex],
          order: index + 1
        };
      }
    });
    
    // Atualizar o estado local
    setDocs(updatedAllDocs);
    
    try {
      // Atualizar no banco de dados
      const updatePromises = reorderedDocs.map((d, index) => {
        return supabase
          .from('doc_items')
          .update({ "order": index + 1 })
          .eq('id', d.id);
      });
      
      await Promise.all(updatePromises);
      
      // Recarregar documentos para garantir que estão atualizados
      await fetchDocs(selectedSection.id, doc.parent_id);
    } catch (error) {
      console.error('Erro ao atualizar ordem dos documentos:', error);
      // Em caso de erro, reverter as alterações locais
      if (selectedSection) {
        fetchDocs(selectedSection.id);
      }
    }
  }

  // Função para buscar documentos órfãos (sem seção atribuída)
  async function fetchOrphanDocs() {
    setIsLoading(true);
    console.log('DocsHub: Carregando documentos órfãos');
    
    const { data, error } = await supabase
      .from('doc_items')
      .select('*')
      .is('section_id', null)
      .order('order', { ascending: true });

    if (error) {
      console.error('DocsHub: Erro ao carregar documentos órfãos:', error);
      toast({
        title: 'Erro ao carregar documentos órfãos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    const sortedData = data ? [...data].sort((a, b) => a.order - b.order) : [];
    console.log('DocsHub: Documentos órfãos carregados:', sortedData.length);
    
    setOrphanDocs(sortedData);
    setIsLoading(false);
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
    <Box maxW="1200px" mx="auto" p={4}>
      <Flex mb={6} justifyContent="space-between" alignItems="center">
        <Heading>Documentação</Heading>
        {appUser?.role === 'admin' && (
          <Button leftIcon={<AddIcon />} colorScheme="yellow" onClick={handleAddSection}>
            Nova Seção
          </Button>
        )}
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" color="yellow.500" />
        </Flex>
      ) : (
        <>
          {/* Conteúdo principal */}
          {selectedSection ? (
            // Exibir seção selecionada com seus documentos
            <Box>
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Button 
                  leftIcon={<ArrowBackIcon />} 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Voltar para seções
                </Button>
              </Flex>
              
              <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} mb={4}>
                {breadcrumbs.map((item, index) => (
                  <BreadcrumbItem key={item.id} isCurrentPage={index === breadcrumbs.length - 1}>
                    <BreadcrumbLink onClick={() => handleBreadcrumbClick(item, index)}>
                    {item.title}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>

              <Flex>
                <Box width="300px" mr={6} borderRight="1px" borderColor="gray.200" pr={4}>
                  <Flex justifyContent="space-between" gap="10px" alignItems="start" mb={4} borderBottom="1px" borderColor="gray.200" pb={3}>
                    <Heading size="md">
                      {/*{selectedSection.title}*/} Documentos
                      </Heading>
                    {appUser?.role === 'admin' && (
                      <Button
                        leftIcon={<AddIcon />}
                        size="sm"
                        colorScheme="yellow"
                        onClick={handleAddDoc}
                      >
                        Novo Doc
                      </Button>
                    )}
                  </Flex>
                  <Box>
                    {docs
                      .filter(doc => doc.section_id === selectedSection.id && !doc.parent_id)
                      .sort((a, b) => a.order - b.order)
                      .map((doc) => (
                        <Box key={doc.id} mb={1}>
                          <Flex
                            p={2}
                            borderRadius="md"
                            bg={selectedDoc?.id === doc.id ? "yellow.50" : "transparent"}
                            _hover={{ bg: selectedDoc?.id === doc.id ? "yellow.50" : "gray.50" }}
                            cursor="pointer"
                            onClick={() => handleDocClick(doc)}
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Flex alignItems="center" flex="1">
                              {hasChildren(doc.id) && (
                                <IconButton
                                  aria-label={expandedDocs[doc.id] ? "Recolher" : "Expandir"}
                                  icon={expandedDocs[doc.id] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={(e) => toggleDocExpand(doc.id, e)}
                                  mr={1}
                                />
                              )}
                              <Text fontWeight={selectedDoc?.id === doc.id ? "semibold" : "normal"} fontSize="sm">
                                {doc.title}
                              </Text>
                            </Flex>
                            
                            {appUser?.role === 'admin' && (
                              <Flex>
                                <Tooltip label="Mover para cima">
                                  <IconButton
                                    aria-label="Mover para cima"
                                    icon={<ArrowUpIcon />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveDoc(doc.id, 'up');
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label="Mover para baixo">
                                  <IconButton
                                    aria-label="Mover para baixo"
                                    icon={<ArrowDownIcon />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveDoc(doc.id, 'down');
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label="Editar documento">
                                  <IconButton
                                    aria-label="Editar documento"
                                    icon={<EditIcon />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditDoc(doc);
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label="Excluir documento">
                                  <IconButton
                                    aria-label="Excluir documento"
                                    icon={<DeleteIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDoc(doc.id);
                                    }}
                                  />
                                </Tooltip>
                              </Flex>
                            )}
                          </Flex>
                          
                          {hasChildren(doc.id) && expandedDocs[doc.id] && (
                            <Box pl={6} mt={1} borderLeft="1px" borderColor="gray.200">
                              {docs
                                .filter(childDoc => childDoc.parent_id === doc.id)
                                .sort((a, b) => a.order - b.order)
                                .map(childDoc => (
                                  <Box key={childDoc.id} mb={1}>
                                    <Flex
                                      p={2}
                                      borderRadius="md"
                                      bg={selectedDoc?.id === childDoc.id ? "yellow.50" : "transparent"}
                                      _hover={{ bg: selectedDoc?.id === childDoc.id ? "yellow.50" : "gray.50" }}
                                      cursor="pointer"
                                      onClick={() => handleDocClick(childDoc)}
                                      justifyContent="space-between"
                                      alignItems="center"
                                    >
                                      <Text fontWeight={selectedDoc?.id === childDoc.id ? "semibold" : "normal"} fontSize="sm">
                                        {childDoc.title}
                                      </Text>
                                      
                                      {appUser?.role === 'admin' && (
                                        <Flex>
                                          <Tooltip label="Editar documento">
                                            <IconButton
                                              aria-label="Editar documento"
                                              icon={<EditIcon />}
                                              size="xs"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditDoc(childDoc);
                                              }}
                                            />
                                          </Tooltip>
                                          <Tooltip label="Excluir documento">
                                            <IconButton
                                              aria-label="Excluir documento"
                                              icon={<DeleteIcon />}
                                              size="xs"
                                              variant="ghost"
                                              colorScheme="red"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDoc(childDoc.id);
                                              }}
                                            />
                                          </Tooltip>
                                        </Flex>
                                      )}
                                    </Flex>
                                  </Box>
                                ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                    {docs.filter(doc => doc.section_id === selectedSection.id && !doc.parent_id).length === 0 && (
                      <Text color="gray.500" py={2}>
                        Nenhum documento nesta seção.
                      </Text>
                    )}
                  </Box>
                </Box>

                <Box flex="1">
                  {selectedDoc ? (
                    // Exibir documento selecionado
                    <Box>
                      <Flex justifyContent="space-between" alignItems="center" mb={6}>
                        <Heading size="lg" color={textColor}>{selectedDoc.title}</Heading>
                        <Flex>
                          <Button
                            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
                            size="sm"
                            variant="outline"
                            colorScheme="yellow"
                            mr={2}
                            onClick={() => {
                              // Se tiver um documento pai, navegar para ele
                              if (selectedDoc.parent_id) {
                                const parentDoc = docs.find(d => d.id === selectedDoc.parent_id);
                                if (parentDoc) {
                                  handleDocClick(parentDoc);
                                }
                              } else {
                                // Caso contrário, limpar a seleção do documento
                                setSelectedDoc(null);
                              }
                            }}
                          >
                            Voltar
                          </Button>
                          {appUser?.role === 'admin' && (
                            <>
                              <IconButton
                                aria-label="Editar documento"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditDoc(selectedDoc)}
                                mr={2}
                              />
                              <Button
                                size="sm"
                                colorScheme="yellow"
                                variant="outline"
                                onClick={() => {
                                  setNewDoc(selectedDoc);
                                  onDocModalOpen();
                                }}
                              >
                                Editar com Visualização
                              </Button>
                            </>
                          )}
                        </Flex>
                      </Flex>
                      <Box className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedDoc.content}
                        </ReactMarkdown>
                      </Box>
                    </Box>
                  ) : (
                    // Exibir informações da seção
                    <Box>
                      <Heading size="lg" mb={2}>{selectedSection.title}</Heading>
                      <Text color="gray.600" mb={6}>{selectedSection.description}</Text>
                      <Divider mb={6} />
                      <Text>Selecione um documento no menu lateral para visualizar seu conteúdo.</Text>
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>
          ) : breadcrumbs.length > 0 && breadcrumbs[0].id === 'orphans' ? (
            // Exibir documentos órfãos
            <Box>
              <Heading size="lg" mb={2} color="orange.500">Documentos sem seção</Heading>
              <Text color="gray.600" mb={6}>
                Estes documentos não estão visíveis para os usuários. Atribua-os a uma seção ou exclua-os.
              </Text>
              <Divider mb={6} />
              {orphanDocs.length > 0 ? (
                <Stack spacing={4}>
                  {orphanDocs.map(doc => (
                    <Card key={doc.id} variant="outline" cursor="pointer" onClick={() => handleDocClick(doc)}>
                      <CardBody>
                        <Flex justifyContent="space-between" alignItems="center">
                          <Box>
                            <Heading size="md" mb={2}>{doc.title}</Heading>
                            <Text noOfLines={2}>{doc.content.replace(/[#*`]/g, '')}</Text>
                          </Box>
                          <ButtonGroup size="sm" variant="ghost">
                            <IconButton
                              aria-label="Editar documento"
                              icon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDoc(doc);
                              }}
                            />
                            <IconButton
                              aria-label="Excluir documento"
                              colorScheme="red"
                              icon={<DeleteIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoc(doc.id);
                              }}
                            />
                          </ButtonGroup>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text>Não há documentos sem seção.</Text>
              )}
            </Box>
          ) : (
            // Exibir lista de seções (página inicial)
            <Box>
              <Text mb={6}>Selecione uma seção para começar.</Text>
              <Divider mb={6} />
              <VStack spacing={4} align="stretch">
                {sections.map((section, index) => (
                  <Card
                    key={section.id}
                    bg="white"
                    boxShadow="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    cursor="pointer"
                    onClick={() => handleSectionClick(section)}
                    transition="all 0.2s"
                    _hover={{
                      boxShadow: "lg",
                      borderColor: "yellow.300"
                    }}
                  >
                    <CardBody>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Box>
                          <Heading size="sm">{section.title}</Heading>
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {section.description}
                          </Text>
                        </Box>
                        {appUser?.role === 'admin' && (
                          <Flex>
                            <Tooltip label="Mover para cima">
                              <IconButton
                                aria-label="Mover para cima"
                                icon={<ArrowUpIcon />}
                                size="sm"
                                variant="ghost"
                                isDisabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSection(section.id, 'up');
                                }}
                              />
                            </Tooltip>
                            <Tooltip label="Mover para baixo">
                              <IconButton
                                aria-label="Mover para baixo"
                                icon={<ArrowDownIcon />}
                                size="sm"
                                variant="ghost"
                                isDisabled={index === sections.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSection(section.id, 'down');
                                }}
                              />
                            </Tooltip>
                            <Tooltip label="Editar seção">
                              <IconButton
                                aria-label="Editar seção"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSection(section);
                                }}
                              />
                            </Tooltip>
                            <Tooltip label="Excluir seção">
                              <IconButton
                                aria-label="Excluir seção"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSection(section.id);
                                }}
                              />
                            </Tooltip>
                          </Flex>
                        )}
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>
          )}
        </>
      )}

      {/* Modal para criar/editar seção */}
      <Modal isOpen={isSectionModalOpen} onClose={onSectionModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Editar Seção' : 'Nova Seção'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Título</FormLabel>
                <Input
                  value={newSection.title || ''}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  placeholder="Título da seção"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Textarea
                  value={newSection.description || ''}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  placeholder="Descrição da seção"
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSectionModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              onClick={handleSaveSection}
              isLoading={isLoading}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para criar/editar documento */}
      <Modal isOpen={isDocModalOpen} onClose={handleDocModalClose} size="5xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <Flex justifyContent="space-between" alignItems="center">
              <Text>{isEditing ? 'Editar Documento' : 'Novo Documento'}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <Stack spacing={4}>
              <Flex gap={4}>
                <FormControl isRequired flex="2">
                  <FormLabel>Título</FormLabel>
                  <Input
                    value={newDoc.title || ''}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Título do documento"
                  />
                </FormControl>
                <FormControl flex="1">
                  <FormLabel>Seção</FormLabel>
                  <Select
                    value={newDoc.section_id || ''}
                    onChange={(e) => setNewDoc({ ...newDoc, section_id: e.target.value })}
                  >
                    <option value="">Selecione uma seção</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl flex="1">
                  <FormLabel>Documento pai (opcional)</FormLabel>
                  <Select
                    value={newDoc.parent_id || ''}
                    onChange={(e) => setNewDoc({ ...newDoc, parent_id: e.target.value || null })}
                  >
                    <option value="">Nenhum (documento raiz)</option>
                    {docs
                      .filter(doc => doc.section_id === newDoc.section_id && doc.id !== newDoc.id)
                      .map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title}
                        </option>
                      ))}
                  </Select>
                </FormControl>
              </Flex>
              <FormControl isRequired>
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <FormLabel mb={0}>Conteúdo</FormLabel>
                  <Button 
                    size="sm" 
                    leftIcon={<AddIcon />} 
                    onClick={() => {
                      setIsUploading(true);
                      onDocModalOpen();
                    }}
                    isLoading={isUploading}
                    colorScheme="yellow"
                  >
                    Adicionar Mídia
                  </Button>
                </Flex>
                <Box 
                  border="1px" 
                  borderColor={editorBorderColor} 
                  borderRadius="md"
                  height="600px"
                >
                  <Editor
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    init={{
                      height: 600,
                      inline: false,
                      menubar: 'file edit view insert format tools table',
                      plugins: [
                        'advlist autolink lists link image charmap preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table paste help wordcount'
                      ],
                      toolbar: 'undo redo | formatselect | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | link image media table | help',
                      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px }',
                      entity_encoding: 'raw',
                      verify_html: false,
                      forced_root_block: 'p',
                      promotion: false,
                      base_url: '/tinymce',
                      suffix: '.min',
                      images_upload_handler: async (blobInfo) => {
                        try {
                          setIsUploading(true);
                          const file = blobInfo.blob();
                          const fileName = `${Date.now()}.${file.type.split('/')[1]}`;
                          const filePath = `docs/${fileName}`;

                          const { error } = await supabase.storage
                            .from('media')
                            .upload(filePath, file);

                          if (error) throw error;

                          const { data } = supabase.storage
                            .from('media')
                            .getPublicUrl(filePath);

                          return data.publicUrl;
                        } catch (error) {
                          console.error('Erro no upload:', error);
                          toast({
                            title: 'Erro ao fazer upload da imagem',
                            description: 'Não foi possível fazer o upload da imagem',
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                          });
                          return '';
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                    value={newDoc.content || ''}
                    onEditorChange={(content) => {
                      console.log('Conteúdo alterado:', content);
                      setNewDoc({ ...newDoc, content });
                    }}
                    disabled={false}
                  />
                </Box>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Dica: Você pode colar imagens diretamente no editor (Ctrl+V).
                </Text>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleDocModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              onClick={handleSaveDoc}
              isLoading={isLoading}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}