'use client';
import React from 'react';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  useToast,
  Card,
  CardBody,
  Image,
  Badge,
  Flex,
  Spinner,
  useColorMode,
  VStack,
  HStack,
  useBreakpointValue,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useMediaQuery,
  Skeleton,
  SkeletonText,
  Divider,
} from '@chakra-ui/react';
import { SearchIcon, ShoppingCart, TimerIcon, CheckCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Supply, SupplyRequest } from './types';
import {
  fetchSupplies,
  fetchRequests,
  handleRequesterConfirmation as handleRequesterConfirmationOrig,
  cancelRequest as cancelRequestOrig,
  submitRequest,
  filterSupplies,
  filterRequests,
} from './utils/requestUtils';
import {
  fetchAvailableInventory,
  fetchAllocations,
  allocateInventoryItem,
} from '@/features/inventory/api/inventoryApi';
import { MyAllocationsPage } from '@/app/(dashboard)/supply-requests/components/MyAllocationsPage';

import { InventoryAllocationModal } from '@/components/InventoryAllocationModal';
import { DeliveryDetailsModal } from './components/DeliveryDetailsModal';
import { CatalogTab } from './components/Tabs/CatalogTab';
import { InventoryTab } from './components/Tabs/InventoryTab';
import { MyRequestsTab } from './components/Tabs/MyRequestsTab';
import { CartTab } from './components/Tabs/CartTab';
import { useFilters, useTabs } from '@/contexts/GlobalContext';
import { useCartContext } from '@/features/supply-requests/context/CartContext';
import { useInventoryCache } from '@/features/inventory/context/InventoryCacheContext';
import type { InventoryItem, InventoryAllocation } from '@/features/inventory/types';
import { fetchLocalesByUserLocation } from '@/features/reference-data';
import { ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR } from '@ti-assistant/contracts/dist/roles';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

// Layout reutilizável para abas persistentes (copiado/adaptado do admin)
function PersistentTabsLayout({ tabLabels, children, onTabChange, storageKey = 'persistentTabIndexColab' }: { tabLabels: string[], children: React.ReactNode[], onTabChange?: (() => void)[], storageKey?: string }) {
  const { activeTab, setActiveTab } = useTabs();
  const prevTab = useRef(0);
  const [hasFetched, setHasFetched] = useState(() => tabLabels.map(() => false));
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  // Cart count and bump animation
  const { cart } = useCartContext();
  const cartCount = React.useMemo(() => {
    try {
      return (cart || []).reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0);
    } catch {
      return 0;
    }
  }, [cart]);
  const [cartBump, setCartBump] = useState(false);
  useEffect(() => {
    if (cartCount > 0) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 400);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  // Declarar todas as cores no topo
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const tabListBg = useColorModeValue('gray.50', 'gray.600');
  const tabSelectedBg = useColorModeValue('white', 'gray.700');
  const tabSelectedColor = useColorModeValue('blue.600', 'blue.200');
  const tabSelectedBorder = useColorModeValue('blue.200', 'blue.600');
  const tabHoverBg = useColorModeValue('gray.100', 'gray.500');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setActiveTab(Number(saved));
  }, [storageKey, setActiveTab]);

  useEffect(() => {
    // Ao trocar de aba, resetar o status da aba anterior
    setHasFetched(arr => arr.map((v, i) => i === prevTab.current ? false : v));
    prevTab.current = activeTab;
    // eslint-disable-next-line
  }, [activeTab]);

  useEffect(() => {
    if (!hasFetched[activeTab] && onTabChange && onTabChange[activeTab]) {
      onTabChange[activeTab]();
      setHasFetched(arr => arr.map((v, i) => i === activeTab ? true : v));
    }
    // eslint-disable-next-line
  }, [activeTab, onTabChange, hasFetched]);

  return (
    <>
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        backdropFilter="blur(12px)"
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        h="full"
        w="full"
        py={ isMobile ? "7vh" : 4}
      >
        {!isMobile && (
          <>
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3}>
              <Heading size={{ base: 'md', md: 'lg' }} color={headingColor}>Requisições de Suprimentos</Heading>
            </Flex>
            <Divider />
          </>
        )}
        <Box mb={0} position="sticky" top="7vh" zIndex={21} bg={bgColor} borderRadius="lg">
          <Tabs variant="enclosed" index={activeTab} onChange={setActiveTab} size={{ base: 'sm', md: 'md' }}>
            <TabList
              overflowX="auto"
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              bg={tabListBg}
              borderRadius="lg"
              p={1}
              gap={1}
            >
              {tabLabels.map(label => {
                const isCartTab = label === 'Carrinho';
                const bumpStyle = isCartTab && cartBump ? { transform: 'scale(1.06)', boxShadow: 'md' } : {} as any;
                return (
                <Tab
                  key={label}
                  whiteSpace="nowrap"
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="medium"
                  minH={{ base: '8', md: '10' }}
                  px={{ base: 2, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  borderRadius="md"
                  _selected={{
                    bg: tabSelectedBg,
                    color: tabSelectedColor,
                    boxShadow: 'sm',
                    borderColor: tabSelectedBorder
                  }}
                  _hover={{ bg: tabHoverBg }}
                  transition="all 0.2s ease"
                  style={bumpStyle}
                >
                  {isCartTab ? (
                    <HStack spacing={2} position="relative">
                      <ShoppingCart size={14} />
                      <Text>{label}</Text>
                      {cartCount > 0 && (
                        <Badge colorScheme="red" borderRadius="full" px={2} fontSize="0.65rem">
                          {cartCount}
                        </Badge>
                      )}
                    </HStack>
                  ) : (
                    label
                  )}
                </Tab>
                );
              })}
            </TabList>
          </Tabs>
        </Box>
        <Box mt={0} flex="1" overflowY="auto">
          {children.map((child, idx) => (
            <Box key={idx} display={activeTab === idx ? 'block' : 'none'} w="full">
              {child}
            </Box>
          ))}
        </Box>
      </VStack>
    </>
  );
}

export default function SupplyRequestsPage() {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const {
    supplies,
    suppliesLastFetched,
    setSupplies,
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    reconcileCart,
  } = useCartContext();
  const { inventoryItems, inventoryLastFetched, setInventoryItems } = useInventoryCache();
  const [categories, setCategories] = useState<{ id: string; label: string; }[]>([]);
  const { searchQuery, statusFilter, setSearchQuery, setStatusFilter } = useFilters();
  const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [destination, setDestination] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const toast = useToast();
  const { colorMode } = useColorMode();
  const isMobileValue = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');
  const [filteredInventoryItems, setFilteredInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationDeadline, setAllocationDeadline] = useState('');
  const [allocationDestination, setAllocationDestination] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [allocationRequests, setAllocationRequests] = useState<InventoryAllocation[]>([]);
  const [filteredAllocationRequests, setFilteredAllocationRequests] = useState<InventoryAllocation[]>([]);
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);
  const [userLocales, setUserLocales] = useState<any[]>([]);
  const [localeId, setLocaleId] = useState('');
  const [loadingTabs, setLoadingTabs] = useState([true, true, true, true, true]);

  const availableSuppliesCount = supplies.filter((supply) => supply.available_quantity > 0).length;

  const notifyCartReconciliation = (changed: boolean) => {
    if (!changed) return;
    toast({
      title: 'Carrinho atualizado',
      description: 'Carrinho atualizado conforme estoque disponível',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const applySuppliesUpdate = (suppliesData: Supply[]) => {
    setSupplies(suppliesData);
    notifyCartReconciliation(reconcileCart(suppliesData));
  };

  // Verificar se precisa buscar suprimentos
  const shouldFetchSupplies = () => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    const hasInvalidShape = supplies.some((supply) => typeof supply.available_quantity !== 'number');
    return hasInvalidShape || !suppliesLastFetched || (Date.now() - suppliesLastFetched) > CACHE_DURATION;
  };

  // Verificar se precisa buscar inventário
  const shouldFetchInventory = () => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    return !inventoryLastFetched || (Date.now() - inventoryLastFetched) > CACHE_DURATION;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const access = assertPageAccess(
      resolveUserRoles(user),
      ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR,
    );
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }

    // Transformar categorias em objetos
    const uniqueCategories = Array.from(
      new Set(supplies.map(s => s.category?.label).filter((label): label is string => Boolean(label))),
    );
    setCategories(uniqueCategories.map((label, index) => ({ id: String(index), label })));

    // Buscar locais da filial do usuário
    const fetchUserLocales = async () => {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        if (!token) return;
        const data = await fetchLocalesByUserLocation(token);
        setUserLocales(data);
      } catch (e) {
        // Silenciar erro
      }
    };
    fetchUserLocales();
  }, [supplies]);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      if (shouldFetchSupplies()) {
        const suppliesData = await fetchSupplies(token);
        applySuppliesUpdate(suppliesData);
        setFilteredSupplies(filterSupplies(suppliesData, searchQuery));
      }

      // Buscar inventário apenas se necessário
      let inventoryData = inventoryItems;
      if (shouldFetchInventory()) {
        inventoryData = await fetchAvailableInventory(token);
        setInventoryItems(inventoryData);
      }

      const [requestsData, allocationsData] = await Promise.all([
        fetchRequests(token),
        fetchAllocations(token)
      ]);
      setFilteredInventoryItems(
        inventoryData.filter((item: InventoryItem) =>
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
      setRequests(requestsData);
      setFilteredRequests(requestsData);
      setAllocationRequests(allocationsData);
      setFilteredAllocationRequests(allocationsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar dados',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilteredSupplies(filterSupplies(supplies, searchQuery));
  }, [searchQuery, supplies]);

  useEffect(() => {
    setFilteredRequests(filterRequests(requests, searchQuery, statusFilter));
  }, [searchQuery, statusFilter, requests]);

  useEffect(() => {
    setLoading(true);
    Promise.resolve(loadInitialData()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFilteredInventoryItems(
      inventoryItems.filter((item: InventoryItem) =>
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  }, [searchQuery, inventoryItems]);

  useEffect(() => {
    setFilteredAllocationRequests(
      allocationRequests.filter(request =>
        (request.inventory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.destination.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (allocationStatusFilter ? request.status === allocationStatusFilter : true)
      )
    );
  }, [searchQuery, allocationStatusFilter, allocationRequests]);

  const handleAddToCart = (supply: Supply) => {
    addToCart({ id: supply.id, quantity: 1, supply });
  };

  const handleRemoveFromCart = (supplyId: string) => {
    removeFromCart(supplyId);
  };

  const handleUpdateQuantity = (supplyId: string, quantity: number) => {
    updateCartItem(supplyId, quantity);
  };

  const handleSubmitRequest = async () => {
    try {
      // Para mobile: buscar do localStorage se vier do modal mobile
      let deadline = deliveryDeadline;
      let dest = destination;
      if (typeof window !== 'undefined') {
        const storedDeadline = localStorage.getItem('@ti-assistant:deliveryDeadline');
        const storedDestination = localStorage.getItem('@ti-assistant:destination');
        if (storedDeadline) deadline = storedDeadline;
        if (storedDestination) dest = storedDestination;
      }
      // Validação da data
      if (!deadline || isNaN(new Date(deadline).getTime())) {
        toast({
          title: 'Data de entrega inválida',
          description: 'Por favor, preencha uma data de entrega válida.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!dest) {
        toast({
          title: 'Destino obrigatório',
          description: 'Por favor, preencha o campo de destino.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      await submitRequest(cart, deadline, dest, token, localeId);

      toast({
        title: 'Sucesso',
        description: 'Pedido enviado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      localStorage.removeItem('@ti-assistant:deliveryDeadline');
      localStorage.removeItem('@ti-assistant:destination');
      clearCart();
      onClose();
      router.push('/supply-requests');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar pedido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAllocateItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAllocationModalOpen(true);
  };

  const handleAllocationSubmit = async (data: {
    delivery_deadline: string;
    return_date: string;
    destination: string;
    notes: string;
  }) => {
    setIsAllocating(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      if (!selectedItem) throw new Error('Item não selecionado');

      await allocateInventoryItem(
        selectedItem.id,
        data.return_date,
        data.destination,
        data.notes,
        token,
        data.delivery_deadline
      );
      setIsAllocationModalOpen(false);
      setSelectedItem(null);
      loadInitialData();
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao criar alocação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAllocating(false);
    }
  };

  // Função genérica para buscar dados de cada aba
  const fetchTabData = async (tabIndex: number) => {
    setLoadingTabs(tabs => tabs.map((v, i) => i === tabIndex ? true : v));
    await loadInitialData();
    setLoadingTabs(tabs => tabs.map((v, i) => i === tabIndex ? false : v));
  };

  const fetchTabCatalog = async () => {
    setLoadingTabs(tabs => tabs.map((v, i) => i === 0 ? true : v));

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const suppliesData = await fetchSupplies(token);
      applySuppliesUpdate(suppliesData);
      setFilteredSupplies(filterSupplies(suppliesData, searchQuery));
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar suprimentos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingTabs(tabs => tabs.map((v, i) => i === 0 ? false : v));
    }
  };

  // Função específica para o inventário que usa cache
  const fetchTabInventory = async () => {
    setLoadingTabs(tabs => tabs.map((v, i) => i === 1 ? true : v));

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      // Buscar inventário apenas se necessário
      if (shouldFetchInventory()) {
        const inventoryData = await fetchAvailableInventory(token);
        setInventoryItems(inventoryData);
        setFilteredInventoryItems(
          inventoryData.filter((item: InventoryItem) =>
          (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        );
      } else {
        // Usar dados do cache
        setFilteredInventoryItems(
          inventoryItems.filter((item: InventoryItem) =>
          (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.serial_number.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        );
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar inventário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingTabs(tabs => tabs.map((v, i) => i === 1 ? false : v));
    }
  };

  // Funções específicas usando a função genérica
  const fetchTabMyRequests = () => fetchTabData(2);
  const fetchTabMyAllocations = () => fetchTabData(3);
  const fetchTabCart = () => fetchTabData(4);

  const handleRequesterConfirmation = async (requestId: string, confirmation: boolean, token: string) => {
    try {
      await handleRequesterConfirmationOrig(requestId, confirmation, token);
      toast({
        title: 'Sucesso',
        description: 'Confirmação atualizada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadInitialData(); // Atualiza o contexto após confirmação
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar confirmação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancelRequest = async (requestId: string, token: string) => {
    try {
      await cancelRequestOrig(requestId, token);
      toast({
        title: 'Sucesso',
        description: 'Requisição cancelada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadInitialData(); // Atualiza o contexto após cancelamento
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao cancelar requisição',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <PersistentTabsLayout
        tabLabels={['Catálogo', 'Inventário', 'Minhas Requisições', 'Minhas Alocações', 'Carrinho']}
        onTabChange={[fetchTabCatalog, fetchTabInventory, fetchTabMyRequests, fetchTabMyAllocations, fetchTabCart]}
        storageKey="persistentTabIndexColab"
      >
        {[
          loadingTabs[0] ? (
            <Skeleton
              key="skeleton-catalog"
              height="400px"
              width="100%"
            >
              <SkeletonText mt="4" noOfLines={8} spacing="4" />
            </Skeleton>
          ) : (
            <CatalogTab
              supplies={filteredSupplies}
              availableSuppliesCount={availableSuppliesCount}
              onAddToCart={handleAddToCart}
            />
          ),
          loadingTabs[1] ? (
            <Skeleton
              key="skeleton-inventory"
              height="400px"
              width="100%"
            >
              <SkeletonText mt="4" noOfLines={8} spacing="4" />
            </Skeleton>
          ) : (
            <InventoryTab
              inventoryItems={filteredInventoryItems}
              onAllocateItem={handleAllocateItem}
            />
          ),
          loadingTabs[2] ? (
            <Skeleton
              key="skeleton-reqs"
              height="400px"
              width="100%"
            >
              <SkeletonText mt="4" noOfLines={8} spacing="4" />
            </Skeleton>
          ) : (
            <MyRequestsTab
              requests={filteredRequests}
              onRequesterConfirmation={handleRequesterConfirmation}
              onCancelRequest={handleCancelRequest}
              onBatchConfirmed={loadInitialData}
            />
          ),
          loadingTabs[3] ? (
            <Skeleton
              key="skeleton-allocs"
              height="400px"
              width="100%"
            >
              <SkeletonText mt="4" noOfLines={8} spacing="4" />
            </Skeleton>
          ) : (
            <MyAllocationsPage />
          ),
          loadingTabs[4] ? (
            <Skeleton
              key="skeleton-cart"
              height="400px"
              width="100%"
            >
              <SkeletonText mt="4" noOfLines={8} spacing="4" />
            </Skeleton>
          ) : (
            <CartTab
              cart={cart}
              onRemoveFromCart={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenModal={onOpen}
              onContinueShopping={() => router.push('/supply-requests')}
            />
          )
        ]}
      </PersistentTabsLayout>

      {/* Modal de Alocação de Inventário */}
      {selectedItem && (
        <InventoryAllocationModal
          isOpen={isAllocationModalOpen}
          onClose={() => {
            setIsAllocationModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSubmit={handleAllocationSubmit}
          isLoading={isAllocating}
        />
      )}

      {/* Modal de Detalhes da Entrega */}
      <DeliveryDetailsModal
        isOpen={isOpen}
        onClose={onClose}
        deliveryDeadline={deliveryDeadline}
        setDeliveryDeadline={setDeliveryDeadline}
        destination={destination}
        setDestination={setDestination}
        userLocales={userLocales}
        onSubmit={handleSubmitRequest}
        isSubmitting={false}
        localeId={localeId}
        setLocaleId={setLocaleId}
      />
    </>
  );
} 