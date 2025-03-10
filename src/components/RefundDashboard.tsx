import { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  useToast,
  Switch,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Image,
  useColorModeValue,
  Stack,
  FormControl,
  FormLabel,
  Tooltip,
  TableContainer,
  InputGroup,
  InputLeftElement,
  IconButton,
  useBoolean,
  Heading,
  Grid,
  GridItem,
  Link,
  Divider,
  Textarea,
  ModalFooter,
} from '@chakra-ui/react';
import { SearchIcon, RepeatIcon, ChevronDownIcon, ExternalLinkIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Importar os SVGs das plataformas
import hublaLogo from '../assets/hubla.svg';
import hotmartLogo from '../assets/hotmart.svg';
import kiwifyLogo from '../assets/kiwify.svg';

interface Refund {
  id: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  type: 'refund' | 'chargeback';
  access_revoked: boolean;
  concluido: boolean;
  close_date?: string;
  platform: 'Hubla' | 'Hotmart' | 'Kiwify' | null;
  phone?: string;
  invoice_id?: string;
  payment_method?: string;
  purchase_date?: string;
  refund_motive?: string;
  notes?: string;
}

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function RefundDashboard() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({
    type: '',
    search: '',
    platform: '',
    accessRevoked: '',
    concluido: '',
    order: 'desc',
  });
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [editingMotive, setEditingMotive] = useBoolean(false);
  const [editingNotes, setEditingNotes] = useBoolean(false);
  const [tempMotive, setTempMotive] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { appUser } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');
  const menuBgColor = useColorModeValue('white', 'gray.700');
  const menuBorderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchRefunds();
  }, [filter]);

  async function fetchRefunds() {
    setIsLoading(true);
    let query = supabase
      .from('data')
      .select('*')
      .order('created_at', { ascending: filter.order === 'asc' });

    if (filter.type) {
      query = query.eq('type', filter.type);
    }
    if (filter.platform) {
      if (filter.platform === 'null') {
        query = query.is('platform', null);
      } else {
        query = query.eq('platform', filter.platform);
      }
    }
    if (filter.accessRevoked === 'true') {
      query = query.eq('access_revoked', true);
    } else if (filter.accessRevoked === 'false') {
      query = query.eq('access_revoked', false);
    }
    if (filter.search) {
      query = query.or(`customer_name.ilike.%${filter.search}%,customer_email.ilike.%${filter.search}%`);
    }
    if (filter.concluido === 'true') {
      query = query.eq('concluido', true);
    } else if (filter.concluido === 'false') {
      query = query.eq('concluido', false);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Erro ao buscar reembolsos',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setRefunds(data || []);
    setIsLoading(false);
  }

  async function handleAccessRevokedChange(id: number, newValue: boolean) {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('data')
      .update({ access_revoked: newValue })
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao atualizar status de acesso',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Status de acesso atualizado',
        status: 'success',
        duration: 2000,
      });
      
      // Atualizar o estado local
      setRefunds(refunds.map(refund => 
        refund.id === id ? {...refund, access_revoked: newValue} : refund
      ));
    }
    
    setIsLoading(false);
  }

  async function handleConcluidoChange(id: number, newValue: boolean) {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('data')
      .update({ concluido: newValue })
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao atualizar status de conclusão',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Status de conclusão atualizado',
        status: 'success',
        duration: 2000,
      });
      
      // Atualizar o estado local
      setRefunds(refunds.map(refund => 
        refund.id === id ? {...refund, concluido: newValue} : refund
      ));
    }
    
    setIsLoading(false);
  }

  async function handleUpdateField(id: number, field: string, value: string) {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('data')
      .update({ [field]: value })
      .eq('id', id);
    
    if (error) {
      toast({
        title: `Erro ao atualizar ${field}`,
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    } else {
      toast({
        title: `${field === 'refund_motive' ? 'Motivo' : 'Notas'} atualizado com sucesso`,
        status: 'success',
        duration: 2000,
      });
      
      // Atualizar o estado local
      setRefunds(refunds.map(refund => 
        refund.id === id ? {...refund, [field]: value} : refund
      ));
      
      if (selectedRefund) {
        setSelectedRefund({...selectedRefund, [field]: value});
      }
      
      return true;
    }
    
    setIsLoading(false);
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function handleRowClick(refund: Refund) {
    setSelectedRefund(refund);
    setTempMotive(refund.refund_motive || '');
    setTempNotes(refund.notes || '');
    onOpen();
  }

  function formatPhoneForWhatsApp(phone?: string) {
    if (!phone) return '';
    // Remove todos os caracteres não numéricos
    const numericOnly = phone.replace(/\D/g, '');
    
    // Se começar com 0, remova-o
    const withoutLeadingZero = numericOnly.startsWith('0') 
      ? numericOnly.substring(1) 
      : numericOnly;
    
    // Se não tiver o código do país, adicione o Brasil (+55)
    const withCountryCode = withoutLeadingZero.length <= 11 
      ? `55${withoutLeadingZero}` 
      : withoutLeadingZero;
    
    return withCountryCode;
  }

  async function handleSaveMotive() {
    if (selectedRefund) {
      const success = await handleUpdateField(selectedRefund.id, 'refund_motive', tempMotive);
      if (success) {
        setEditingMotive.off();
      }
    }
  }

  async function handleSaveNotes() {
    if (selectedRefund) {
      const success = await handleUpdateField(selectedRefund.id, 'notes', tempNotes);
      if (success) {
        setEditingNotes.off();
      }
    }
  }

  if (!appUser || (appUser.role !== 'admin' && appUser.role !== 'support')) {
    return (
      <Box p={6}>
        <Text>Acesso negado. Apenas administradores e suporte podem acessar esta página.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Box bg={bgColor} borderRadius="lg" boxShadow="sm" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
        <Box p={6}>
          <Text fontSize="xl" fontWeight="semibold" mb={4} color={textColor}>
            Gerencie os reembolsos e chargebacks
          </Text>

          <Flex gap={4} mb={6} flexWrap="wrap">
            <InputGroup flex="1" minW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Buscar por nome ou email do cliente"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                _focus={{ outline: "none", boxShadow: "none", borderColor: "gray.300" }}
                height="40px"
              />
            </InputGroup>
            
            <Box width="200px" position="relative">
              <Menu autoSelect={false} closeOnSelect={true}>
                <MenuButton
                  as={Button}
                  width="100%"
                  textAlign="left"
                  variant="outline"
                  size="md"
                  borderColor={borderColor}
                  color={textColor}
                  bg={menuBgColor}
                  _hover={{ borderColor: menuBorderColor }}
                  _focus={{ outline: "none", boxShadow: "none" }}
                >
                  <Text isTruncated>
                    {filter.type ? (filter.type === 'refund' ? 'Reembolso' : 'Chargeback') : 'Todos os tipos'}
                  </Text>
                </MenuButton>
                <MenuList
                  bg={menuBgColor}
                  borderColor={menuBorderColor}
                  boxShadow="lg"
                >
                  <MenuItem
                    onClick={() => setFilter({ ...filter, type: '' })}
                    _hover={{ bg: hoverBgColor }}
                    color={textColor}
                  >
                    Todos os tipos
                  </MenuItem>
                  <MenuItem
                    onClick={() => setFilter({ ...filter, type: 'refund' })}
                    _hover={{ bg: hoverBgColor }}
                    color={textColor}
                  >
                    Reembolso
                  </MenuItem>
                  <MenuItem
                    onClick={() => setFilter({ ...filter, type: 'chargeback' })}
                    _hover={{ bg: hoverBgColor }}
                    color={textColor}
                  >
                    Chargeback
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            
            <Box width="220px" position="relative">
              <Menu autoSelect={false} closeOnSelect={true}>
                <MenuButton 
                  as={Button} 
                  width="100%"
                  textAlign="left"
                  variant="outline"
                  size="md"
                  borderColor="gray.400"
                  color="black"
                  _hover={{ borderColor: "gray.500", outline: "none", boxShadow: "none" }}
                  _focus={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  _active={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  paddingRight="30px"
                  paddingLeft="10px"
                  height="40px"
                  style={{ outline: "none" }}
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  tabIndex={-1}
                >
                  {filter.platform ? (
                    filter.platform === 'null' ? (
                      <Flex alignItems="center" width="100%">
                        <Box 
                          width="20px" 
                          height="20px" 
                          bg="gray.100" 
                          borderRadius="sm" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center" 
                          mr={2}
                          flexShrink={0}
                        >
                          <Text fontSize="xs" fontWeight="medium" color="gray.500">?</Text>
                        </Box>
                        <Text isTruncated maxWidth="calc(100% - 30px)" color="black">
                          Indefinido
                        </Text>
                      </Flex>
                    ) : (
                      <Flex 
                        alignItems="center" 
                        style={{ outline: "none" }}
                        _focus={{ outline: "none", boxShadow: "none" }}
                        _hover={{ outline: "none", boxShadow: "none" }}
                        _active={{ outline: "none", boxShadow: "none" }}
                        className="no-outline"
                      >
                        <Image 
                          src={
                            filter.platform === 'Hubla' 
                              ? hublaLogo 
                              : filter.platform === 'Hotmart' 
                              ? hotmartLogo 
                              : kiwifyLogo
                          } 
                          alt={filter.platform} 
                          boxSize="24px"
                          mr={2}
                          flexShrink={0}
                        />
                        <Text isTruncated maxWidth="calc(100% - 30px)" color="black">
                          {filter.platform}
                        </Text>
                      </Flex>
                    )
                  ) : (
                    <Text isTruncated width="100%" color="black">
                      Todas as plataformas
                    </Text>
                  )}
                </MenuButton>
                <Box 
                  position="absolute" 
                  right="8px" 
                  top="50%" 
                  transform="translateY(-50%)" 
                  pointerEvents="none"
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="20px"
                  height="20px"
                  bg="white"
                >
                  <ChevronDownIcon color="black" />
                </Box>
                <MenuList 
                  zIndex={3}
                  borderRadius="md"
                  boxShadow="0px 4px 12px rgba(0, 0, 0, 0.15)"
                  _focus={{ outline: "none", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)" }}
                  style={{ outline: "none" }}
                  className="no-outline"
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15) !important;
                    }
                    
                    button {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                    
                    button:hover, button:focus, button:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  sx={{
                    "& button:focus": { outline: "none", boxShadow: "none" },
                    "& button": { 
                      bg: "white", 
                      color: "black",
                      _hover: { bg: "gray.50", outline: "none", boxShadow: "none" },
                      _focus: { outline: "none", boxShadow: "none" },
                      _active: { outline: "none", boxShadow: "none" },
                      style: { outline: "none" }
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, platform: '' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Todas as plataformas
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, platform: 'Hubla' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    <Flex 
                      alignItems="center" 
                      style={{ outline: "none" }}
                      _focus={{ outline: "none", boxShadow: "none" }}
                      _hover={{ outline: "none", boxShadow: "none" }}
                      _active={{ outline: "none", boxShadow: "none" }}
                      className="no-outline"
                    >
                      <Image 
                        src={hublaLogo} 
                        alt="Hubla" 
                        boxSize="24px"
                        mr={2}
                        flexShrink={0}
                      />
                      <Text isTruncated maxWidth="calc(100% - 30px)" color="black">
                        Hubla
                      </Text>
                    </Flex>
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, platform: 'Hotmart' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    <Flex 
                      alignItems="center" 
                      style={{ outline: "none" }}
                      _focus={{ outline: "none", boxShadow: "none" }}
                      _hover={{ outline: "none", boxShadow: "none" }}
                      _active={{ outline: "none", boxShadow: "none" }}
                      className="no-outline"
                    >
                      <Image 
                        src={hotmartLogo} 
                        alt="Hotmart" 
                        boxSize="24px"
                        mr={2}
                        flexShrink={0}
                      />
                      <Text isTruncated maxWidth="calc(100% - 30px)" color="black">
                        Hotmart
                      </Text>
                    </Flex>
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, platform: 'Kiwify' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    <Flex 
                      alignItems="center" 
                      style={{ outline: "none" }}
                      _focus={{ outline: "none", boxShadow: "none" }}
                      _hover={{ outline: "none", boxShadow: "none" }}
                      _active={{ outline: "none", boxShadow: "none" }}
                      className="no-outline"
                    >
                      <Image 
                        src={kiwifyLogo} 
                        alt="Kiwify" 
                        boxSize="24px"
                        mr={2}
                        flexShrink={0}
                      />
                      <Text isTruncated maxWidth="calc(100% - 30px)" color="black">
                        Kiwify
                      </Text>
                    </Flex>
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, platform: 'null' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    <Flex 
                      alignItems="center" 
                      style={{ outline: "none" }}
                      _focus={{ outline: "none", boxShadow: "none" }}
                      _hover={{ outline: "none", boxShadow: "none" }}
                      _active={{ outline: "none", boxShadow: "none" }}
                      className="no-outline"
                    >
                      <Box 
                        width="20px" 
                        height="20px" 
                        bg="gray.100" 
                        borderRadius="sm" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        mr={2}
                      >
                        <Text fontSize="xs" fontWeight="medium" color="gray.500">?</Text>
                      </Box>
                      Indefinido
                    </Flex>
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            
            <Box width="220px" position="relative">
              <Menu autoSelect={false} closeOnSelect={true}>
                <MenuButton 
                  as={Button} 
                  width="100%"
                  textAlign="left"
                  variant="outline"
                  size="md"
                  borderColor="gray.400"
                  color="black"
                  _hover={{ borderColor: "gray.500", outline: "none", boxShadow: "none" }}
                  _focus={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  _active={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  paddingRight="30px"
                  paddingLeft="10px"
                  height="40px"
                  style={{ outline: "none" }}
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  tabIndex={-1}
                >
                  <Text isTruncated width="100%" color="black">
                    {filter.accessRevoked === 'true' 
                      ? 'Acesso Revogado' 
                      : filter.accessRevoked === 'false' 
                      ? 'Acesso Ativo' 
                      : 'Todos os acessos'}
                  </Text>
                </MenuButton>
                <Box 
                  position="absolute" 
                  right="8px" 
                  top="50%" 
                  transform="translateY(-50%)" 
                  pointerEvents="none"
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="20px"
                  height="20px"
                  bg="white"
                >
                  <ChevronDownIcon color="black" />
                </Box>
                <MenuList 
                  zIndex={3}
                  borderRadius="md"
                  boxShadow="0px 4px 12px rgba(0, 0, 0, 0.15)"
                  _focus={{ outline: "none", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)" }}
                  style={{ outline: "none" }}
                  className="no-outline"
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15) !important;
                    }
                    
                    button {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                    
                    button:hover, button:focus, button:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  sx={{
                    "& button:focus": { outline: "none", boxShadow: "none" },
                    "& button": { 
                      bg: "white", 
                      color: "black",
                      _hover: { bg: "gray.50", outline: "none", boxShadow: "none" },
                      _focus: { outline: "none", boxShadow: "none" },
                      _active: { outline: "none", boxShadow: "none" },
                      style: { outline: "none" }
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, accessRevoked: '' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Todos os acessos
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, accessRevoked: 'true' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Acesso Revogado
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, accessRevoked: 'false' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Acesso Ativo
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            
            <Box width="200px" position="relative">
              <Menu autoSelect={false} closeOnSelect={true}>
                <MenuButton 
                  as={Button} 
                  width="100%"
                  textAlign="left"
                  variant="outline"
                  size="md"
                  borderColor="gray.400"
                  color="black"
                  _hover={{ borderColor: "gray.500", outline: "none", boxShadow: "none" }}
                  _focus={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  _active={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  paddingRight="30px"
                  paddingLeft="10px"
                  height="40px"
                  style={{ outline: "none" }}
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  tabIndex={-1}
                >
                  <Text isTruncated width="100%" color="black">
                    {filter.concluido === 'true' 
                      ? 'Concluído' 
                      : filter.concluido === 'false' 
                      ? 'Pendente' 
                      : 'Todos os status'}
                  </Text>
                </MenuButton>
                <Box 
                  position="absolute" 
                  right="8px" 
                  top="50%" 
                  transform="translateY(-50%)" 
                  pointerEvents="none"
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="20px"
                  height="20px"
                  bg="white"
                >
                  <ChevronDownIcon color="black" />
                </Box>
                <MenuList 
                  zIndex={3}
                  borderRadius="md"
                  boxShadow="0px 4px 12px rgba(0, 0, 0, 0.15)"
                  _focus={{ outline: "none", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)" }}
                  style={{ outline: "none" }}
                  className="no-outline"
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15) !important;
                    }
                    
                    button {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                    
                    button:hover, button:focus, button:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  sx={{
                    "& button:focus": { outline: "none", boxShadow: "none" },
                    "& button": { 
                      bg: "white", 
                      color: "black",
                      _hover: { bg: "gray.50", outline: "none", boxShadow: "none" },
                      _focus: { outline: "none", boxShadow: "none" },
                      _active: { outline: "none", boxShadow: "none" },
                      style: { outline: "none" }
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, concluido: '' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Todos os status
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, concluido: 'true' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Concluído
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, concluido: 'false' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Pendente
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            
            <Box width="200px" position="relative">
              <Menu autoSelect={false} closeOnSelect={true}>
                <MenuButton 
                  as={Button} 
                  width="100%"
                  textAlign="left"
                  variant="outline"
                  size="md"
                  borderColor="gray.400"
                  color="black"
                  _hover={{ borderColor: "gray.500", outline: "none", boxShadow: "none" }}
                  _focus={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  _active={{ outline: "none", boxShadow: "none", border: "1px solid", borderColor: "gray.400" }}
                  paddingRight="30px"
                  paddingLeft="10px"
                  height="40px"
                  style={{ outline: "none" }}
                  css={`
                    &:hover, &:focus, &:active {
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `}
                  tabIndex={-1}
                >
                  <Text isTruncated width="100%" color="black">
                    {filter.order === 'asc' ? 'Mais antigos primeiro' : 'Mais recentes primeiro'}
                  </Text>
                </MenuButton>
                <Box 
                  position="absolute" 
                  right="8px" 
                  top="50%" 
                  transform="translateY(-50%)" 
                  pointerEvents="none"
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="20px"
                  height="20px"
                  bg="white"
                >
                  <ChevronDownIcon color="black" />
                </Box>
                <MenuList 
                  zIndex={3}
                  borderRadius="md"
                  boxShadow="0px 4px 12px rgba(0, 0, 0, 0.15)"
                  _focus={{ outline: "none", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)" }}
                  style={{ outline: "none" }}
                  className="no-outline"
                >
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, order: 'desc' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Mais recentes primeiro
                  </MenuItem>
                  <MenuItem 
                    onClick={() => setFilter({ ...filter, order: 'asc' })}
                    _focus={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _active={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    _hover={{ bg: "gray.50", outline: "none", boxShadow: "none" }}
                    style={{ outline: "none" }}
                    tabIndex={-1}
                    className="no-outline"
                    role="menuitem"
                  >
                    Mais antigos primeiro
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            
            <Tooltip label="Atualizar lista">
              <IconButton
                aria-label="Atualizar lista"
                icon={<RepeatIcon color="black" />}
                onClick={fetchRefunds}
                isLoading={isLoading}
                bg="#FFDB01"
                _hover={{ bg: "#e5c501" }}
                _focus={{ outline: "none", boxShadow: "none" }}
                _active={{ outline: "none", boxShadow: "none" }}
              />
            </Tooltip>
          </Flex>
        </Box>
      </Box>

      <TableContainer overflowX="auto" maxW="100%">
        <Table variant="simple" size="sm" width="100%">
          <Thead>
            <Tr>
              <Th color={mutedTextColor}>DATA DE CRIAÇÃO</Th>
              <Th color={mutedTextColor}>CLIENTE</Th>
              <Th color={mutedTextColor}>EMAIL</Th>
              <Th color={mutedTextColor}>VALOR</Th>
              <Th color={mutedTextColor}>TIPO</Th>
              <Th color={mutedTextColor}>STATUS</Th>
              <Th color={mutedTextColor}>PLATAFORMA</Th>
              <Th color={mutedTextColor}>ACESSO REVOGADO</Th>
              <Th color={mutedTextColor}>CONCLUÍDO</Th>
            </Tr>
          </Thead>
          <Tbody>
            {refunds.map((refund) => (
              <Tr 
                key={refund.id}
                bg={refund.concluido ? useColorModeValue('green.50', 'green.900') : 'transparent'}
                _hover={{ bg: hoverBgColor, cursor: "pointer" }}
                onClick={() => handleRowClick(refund)}
              >
                <Td color={textColor}>{formatDate(refund.created_at)}</Td>
                <Td color={textColor}>{refund.customer_name}</Td>
                <Td color={textColor}>{refund.customer_email}</Td>
                <Td color={textColor}>{formatCurrency(refund.amount)}</Td>
                <Td>
                  <Badge
                    colorScheme={refund.type === 'refund' ? 'green' : 'red'}
                    rounded="full"
                    px={2}
                  >
                    {refund.type === 'refund' ? 'Reembolso' : 'Chargeback'}
                  </Badge>
                </Td>
                <Td>
                  <Badge
                    colorScheme={refund.concluido ? 'green' : 'yellow'}
                    rounded="full"
                    px={2}
                  >
                    {refund.concluido ? 'Concluído' : 'Pendente'}
                  </Badge>
                </Td>
                <Td>
                  <Tooltip label={refund.platform || 'Indefinido'}>
                    <Box 
                      p={1} 
                      borderRadius="md" 
                      bg="white" 
                      border="1px solid"
                      borderColor="gray.200"
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      width="40px"
                      height="40px"
                      overflow="hidden"
                    >
                      {refund.platform ? (
                        <Image 
                          src={
                            refund.platform === 'Hubla' 
                              ? hublaLogo 
                              : refund.platform === 'Hotmart' 
                              ? hotmartLogo 
                              : kiwifyLogo
                          } 
                          alt={refund.platform} 
                          boxSize="24px"
                          objectFit="contain"
                          bg="transparent"
                          mixBlendMode="multiply"
                        />
                      ) : (
                        <Text fontSize="xs" fontWeight="medium" color="gray.500">
                          Indefinido
                        </Text>
                      )}
                    </Box>
                  </Tooltip>
                </Td>
                <Td>
                  <FormControl display="flex" alignItems="center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      id={`access-revoked-${refund.id}`}
                      isChecked={refund.access_revoked}
                      onChange={(e) => handleAccessRevokedChange(refund.id, e.target.checked)}
                      colorScheme="red"
                      size="sm"
                    />
                    <FormLabel htmlFor={`access-revoked-${refund.id}`} mb="0" ml="2" fontSize="sm">
                      {refund.access_revoked ? 'Sim' : 'Não'}
                    </FormLabel>
                  </FormControl>
                </Td>
                <Td>
                  <FormControl display="flex" alignItems="center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      id={`concluido-${refund.id}`}
                      isChecked={refund.concluido}
                      onChange={(e) => handleConcluidoChange(refund.id, e.target.checked)}
                      colorScheme="green"
                      size="sm"
                    />
                    <FormLabel htmlFor={`concluido-${refund.id}`} mb="0" ml="2" fontSize="sm">
                      {refund.concluido ? 'Sim' : 'Não'}
                    </FormLabel>
                  </FormControl>
                </Td>
              </Tr>
            ))}
            {refunds.length === 0 && (
              <Tr>
                <Td colSpan={8} textAlign="center" py={8}>
                  <Text color="gray.500">
                    Nenhum reembolso encontrado
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader color={textColor}>
            Detalhes do Reembolso
            <Badge
              ml={2}
              colorScheme={selectedRefund?.type === 'refund' ? 'green' : 'red'}
              rounded="full"
              px={2}
            >
              {selectedRefund?.type === 'refund' ? 'Reembolso' : 'Chargeback'}
            </Badge>
            <Badge
              ml={2}
              colorScheme={selectedRefund?.concluido ? 'green' : 'yellow'}
              rounded="full"
              px={2}
            >
              {selectedRefund?.concluido ? 'Concluído' : 'Pendente'}
            </Badge>
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody pb={6}>
            {selectedRefund && (
              <Stack spacing={4}>
                <Heading size="md" mb={2}>Informações do Cliente</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="bold">Nome:</Text>
                    <Text>{selectedRefund.customer_name}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Email:</Text>
                    <Text>{selectedRefund.customer_email}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Telefone:</Text>
                    <Flex alignItems="center">
                      <Text>{selectedRefund.phone || 'Não informado'}</Text>
                      {selectedRefund.phone && (
                        <Link 
                          href={`https://wa.me/${formatPhoneForWhatsApp(selectedRefund.phone)}?text=${encodeURIComponent("Olá! Tudo bem?\n\nVimos que você solicitou um reembolso na Plataforma Vinícius Oliveira e queremos entender melhor sua experiência.\n\nSe tiver alguma dificuldade, estamos aqui para ajudar! Caso prefira seguir com o reembolso, podemos dar andamento conforme nossa política.\n\nMe conta como podemos te ajudar?")}`} 
                          isExternal 
                          ml={2}
                        >
                          <Button 
                            size="xs" 
                            colorScheme="green" 
                            leftIcon={<ExternalLinkIcon />}
                          >
                            WhatsApp
                          </Button>
                        </Link>
                      )}
                    </Flex>
                  </GridItem>
                </Grid>

                <Divider my={2} />
                
                <Heading size="md" mb={2}>Informações da Transação</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="bold">ID da Fatura:</Text>
                    <Text>{selectedRefund.invoice_id || 'Não informado'}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Valor:</Text>
                    <Text>{formatCurrency(selectedRefund.amount)}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Método de Pagamento:</Text>
                    <Text>{selectedRefund.payment_method || 'Não informado'}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Plataforma:</Text>
                    <Flex alignItems="center">
                      {selectedRefund.platform ? (
                        <>
                          <Link 
                            href={
                              selectedRefund.platform === 'Hubla' 
                                ? 'https://app.hub.la/dashboard' 
                                : selectedRefund.platform === 'Hotmart' 
                                ? 'https://sso.hotmart.com/login' 
                                : 'https://dashboard.kiwify.com.br/'
                            } 
                            isExternal
                            _hover={{ textDecoration: 'none' }}
                          >
                            <Tooltip label={`Acessar ${selectedRefund.platform}`}>
                              <Box 
                                p={1} 
                                borderRadius="md" 
                                bg="white" 
                                border="1px solid"
                                borderColor="gray.200"
                                display="flex" 
                                alignItems="center" 
                                justifyContent="center"
                                width="30px"
                                height="30px"
                                mr={2}
                                overflow="hidden"
                                cursor="pointer"
                                _hover={{ borderColor: "blue.300", boxShadow: "0 0 0 1px var(--chakra-colors-blue-300)" }}
                                transition="all 0.2s"
                              >
                                <Image 
                                  src={
                                    selectedRefund.platform === 'Hubla' 
                                      ? hublaLogo 
                                      : selectedRefund.platform === 'Hotmart' 
                                      ? hotmartLogo 
                                      : kiwifyLogo
                                  } 
                                  alt={selectedRefund.platform} 
                                  boxSize="20px"
                                  objectFit="contain"
                                  bg="transparent"
                                />
                              </Box>
                            </Tooltip>
                          </Link>
                          <Text>{selectedRefund.platform}</Text>
                        </>
                      ) : (
                        <Text>Indefinido</Text>
                      )}
                    </Flex>
                  </GridItem>
                </Grid>

                <Divider my={2} />
                
                <Heading size="md" mb={2}>Informações de Datas</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="bold">Data da Compra:</Text>
                    <Text>{formatDate(selectedRefund.purchase_date)}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Data do Reembolso:</Text>
                    <Text>{formatDate(selectedRefund.created_at)}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Data de Conclusão:</Text>
                    <Text>{formatDate(selectedRefund.close_date)}</Text>
                  </GridItem>
                </Grid>

                <Divider my={2} />
                
                <Heading size="md" mb={2}>Informações do Reembolso</Heading>
                <Grid templateColumns="repeat(1, 1fr)" gap={4}>
                  <GridItem>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold">Motivo do Reembolso:</Text>
                      {!editingMotive ? (
                        <IconButton
                          aria-label="Editar motivo"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={setEditingMotive.on}
                        />
                      ) : (
                        <Flex>
                          <IconButton
                            aria-label="Salvar motivo"
                            icon={<CheckIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            mr={1}
                            onClick={handleSaveMotive}
                          />
                          <IconButton
                            aria-label="Cancelar edição"
                            icon={<CloseIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              setTempMotive(selectedRefund.refund_motive || '');
                              setEditingMotive.off();
                            }}
                          />
                        </Flex>
                      )}
                    </Flex>
                    {!editingMotive ? (
                      <Text>{selectedRefund.refund_motive || 'Não informado'}</Text>
                    ) : (
                      <Textarea
                        value={tempMotive}
                        onChange={(e) => setTempMotive(e.target.value)}
                        placeholder="Informe o motivo do reembolso"
                        size="sm"
                        mt={2}
                      />
                    )}
                  </GridItem>
                  
                  <GridItem>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold">Notas:</Text>
                      {!editingNotes ? (
                        <IconButton
                          aria-label="Editar notas"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={setEditingNotes.on}
                        />
                      ) : (
                        <Flex>
                          <IconButton
                            aria-label="Salvar notas"
                            icon={<CheckIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            mr={1}
                            onClick={handleSaveNotes}
                          />
                          <IconButton
                            aria-label="Cancelar edição"
                            icon={<CloseIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              setTempNotes(selectedRefund.notes || '');
                              setEditingNotes.off();
                            }}
                          />
                        </Flex>
                      )}
                    </Flex>
                    {!editingNotes ? (
                      <Text>{selectedRefund.notes || 'Nenhuma nota adicionada'}</Text>
                    ) : (
                      <Textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Adicione notas sobre este caso"
                        size="sm"
                        mt={2}
                      />
                    )}
                  </GridItem>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={4}>
                  <GridItem>
                    <Text fontWeight="bold">Acesso Revogado:</Text>
                    <FormControl display="flex" alignItems="center">
                      <Switch
                        id={`modal-access-revoked-${selectedRefund.id}`}
                        isChecked={selectedRefund.access_revoked}
                        onChange={(e) => {
                          handleAccessRevokedChange(selectedRefund.id, e.target.checked);
                          setSelectedRefund({
                            ...selectedRefund,
                            access_revoked: e.target.checked
                          });
                        }}
                        colorScheme="red"
                        size="sm"
                      />
                      <FormLabel htmlFor={`modal-access-revoked-${selectedRefund.id}`} mb="0" ml="2" fontSize="sm">
                        {selectedRefund.access_revoked ? 'Sim' : 'Não'}
                      </FormLabel>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <Text fontWeight="bold">Concluído:</Text>
                    <FormControl display="flex" alignItems="center">
                      <Switch
                        id={`modal-concluido-${selectedRefund.id}`}
                        isChecked={selectedRefund.concluido}
                        onChange={(e) => {
                          handleConcluidoChange(selectedRefund.id, e.target.checked);
                          setSelectedRefund({
                            ...selectedRefund,
                            concluido: e.target.checked
                          });
                        }}
                        colorScheme="green"
                        size="sm"
                      />
                      <FormLabel htmlFor={`modal-concluido-${selectedRefund.id}`} mb="0" ml="2" fontSize="sm">
                        {selectedRefund.concluido ? 'Sim' : 'Não'}
                      </FormLabel>
                    </FormControl>
                  </GridItem>
                </Grid>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 