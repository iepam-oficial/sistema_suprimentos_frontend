'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
    Box,
    Heading,
    useToast,
    Spinner,
    Flex,
    useColorModeValue,
    VStack,
    useMediaQuery,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    HStack,
    Divider,
    Skeleton,
    SkeletonText,
    Button,
    Text
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
    SupplyRequestsTab,
    AllocationsTab,
    InventoryTransactionsTab,
    StockMovementsTab
} from './components';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportStockMovementsPDF } from './utils/exportStockMovementsPDF';
import { ShoppingCart, TimerIcon, FileText, RotateCcw, Package, ClipboardList, BarChart3, TrendingUp } from 'lucide-react';
import type { SupplyRequest } from '../types';
import type { InventoryAllocation, InventoryTransaction } from '@/features/inventory/types';
import type { StockMovement } from '@/features/catalog/types';
import {
    fetchAllSupplyRequests,
    updateRequestStatus,
    updateManagerDeliveryConfirmation,
    RateLimitError,
} from '@/features/supply-requests/api/adminRequestApi';
import { handleRequesterConfirmation as updateRequesterConfirmation } from '@/features/supply-requests/api/requestApi';
import {
    fetchAllocations,
    fetchInventoryTransactions,
    updateAllocationStatus,
    confirmAllocationDelivery,
    markAllocationLost,
    confirmManagerReturn,
} from '@/features/inventory/api/inventoryApi';
import { fetchStockMovements } from '@/features/catalog/api/catalogApi';

// Layout reutilizável para abas persistentes
function PersistentTabsLayout({ tabLabels, children, onTabChange, storageKey = 'persistentTabIndex' }: { tabLabels: string[], children: React.ReactNode[], onTabChange?: (() => void)[], storageKey?: string }) {
    const [activeTab, setActiveTab] = useState(0);
    const prevTab = useRef(0);
    const [hasFetched, setHasFetched] = useState(() => tabLabels.map(() => false));
    // Precompute themed colors (hooks at top-level)
    const containerBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(45, 55, 72, 0.8)');
    const containerBorder = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.1)');
    const tabListBg = useColorModeValue('gray.50', 'gray.700');
    const tabListBorder = useColorModeValue('gray.200', 'gray.600');
    const tabSelectedBg = useColorModeValue('white', 'gray.800');
    const tabSelectedColor = useColorModeValue('blue.600', 'blue.200');
    const tabSelectedBorder = useColorModeValue('blue.200', 'blue.600');
    const tabHoverBg = useColorModeValue('gray.100', 'gray.600');
    const contentBg = useColorModeValue('white', 'gray.800');
    const contentBorder = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setActiveTab(Number(saved));
    }, [storageKey]);

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
        <Box w="full" h="full" py={{ base: '6vh', md: 0 }}>
            <VStack
                spacing={6}
                align="stretch"
                bg={containerBg}
                backdropFilter="blur(20px)"
                p={{ base: 4, md: 8 }}
                borderRadius="2xl"
                boxShadow="xl"
                borderWidth="1px"
                borderColor={containerBorder}
                h="full"
                position="relative"
                overflow="hidden"
            >
                {/* Background Pattern */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    opacity={0.03}
                    backgroundImage="radial-gradient(circle at 25% 25%, #3182ce 0%, transparent 50%), radial-gradient(circle at 75% 75%, #805ad5 0%, transparent 50%)"
                    pointerEvents="none"
                />
                {/* Título removido para economizar espaço */}
                <Tabs variant="enclosed" index={activeTab} onChange={setActiveTab} size="sm">
                    <TabList
                        bg={tabListBg}
                        borderRadius="md"
                        p={1}
                        boxShadow="sm"
                        border="1px solid"
                        borderColor={tabListBorder}
                        gap={1}
                        mb={2}
                    >
                        {tabLabels.map((label, index) => {
                            const icons = [Package, ClipboardList, BarChart3, TrendingUp];
                            const IconComponent = icons[index];
                            
                            return (
                                <Tab
                                    key={label}
                                    data-testid={index === 0 ? 'admin-tab-suprimentos' : undefined}
                                    _selected={{ bg: tabSelectedBg, color: tabSelectedColor, boxShadow: 'sm', border: '1px solid', borderColor: tabSelectedBorder }}
                                    _hover={{ bg: tabHoverBg }}
                                    transition="all 0.2s ease"
                                    borderRadius="md"
                                    fontWeight="medium"
                                    fontSize="sm"
                                    px={3}
                                    py={2}
                                    mx={0}
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <HStack spacing={2} align="center">
                                        <IconComponent size={16} />
                                        <Text fontSize="sm" fontWeight="medium">{label}</Text>
                                    </HStack>
                                </Tab>
                            );
                        })}
                    </TabList>
                </Tabs>
                <Box 
                    mt={0} 
                    p={6}
                    bg={contentBg}
                    borderRadius="2xl"
                    boxShadow="lg"
                    border="1px solid"
                    borderColor={contentBorder}
                    minH="600px"
                >
                    {children.map((child, idx) => (
                        <Box 
                            key={idx} 
                            display={activeTab === idx ? 'block' : 'none'} 
                            w="full" 
                            h="full"
                            opacity={activeTab === idx ? 1 : 0}
                            transform={activeTab === idx ? 'translateY(0)' : 'translateY(10px)'}
                            transition="all 0.4s ease-out"
                        >
                            {child}
                        </Box>
                    ))}
                </Box>
            </VStack>
        </Box>
    );
}

export default function AdminSupplyRequestsPage() {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [allocationRequests, setAllocationRequests] = useState<InventoryAllocation[]>([]);
    const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [filteredStockMovements, setFilteredStockMovements] = useState<StockMovement[]>([]);
    const [movementSearch, setMovementSearch] = useState('');
    const [movementTypeFilter, setMovementTypeFilter] = useState('');
    const [movementPoloFilter, setMovementPoloFilter] = useState('');
    const [movementSectorFilter, setMovementSectorFilter] = useState('');
    const [movementDateFrom, setMovementDateFrom] = useState('');
    const [movementDateTo, setMovementDateTo] = useState('');
    const [filteredRequests, setFilteredRequests] = useState<SupplyRequest[]>([]);
    const [filteredAllocationRequests, setFilteredAllocationRequests] = useState<InventoryAllocation[]>([]);
    const [filteredInventoryTransactions, setFilteredInventoryTransactions] = useState<InventoryTransaction[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [returnDateFilter, setReturnDateFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [localeFilter, setLocaleFilter] = useState('');
    const [requesterFilter, setRequesterFilter] = useState('');
    const [transactionLocationFilter, setTransactionLocationFilter] = useState('');
    const [transactionLocaleFilter, setTransactionLocaleFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const toast = useToast();
    const colorMode = useColorModeValue('light', 'dark');
    const tabHoverBgDefault = useColorModeValue('gray.100', 'gray.600');
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    // Estados de loading para cada aba
    const [loadingTabs, setLoadingTabs] = useState([true, true, true, true]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
        if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
            router.push('/unauthorized');
            return;
        }

        fetchRequests();
        fetchAllocationRequests();
        loadInventoryTransactions();
        loadStockMovements();
    }, [router]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchRequests(), fetchAllocationRequests(), loadInventoryTransactions(), loadStockMovements()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (search || statusFilter) {
            const filtered = requests.filter(request => {
                const matchesSearch =
                    (request.is_custom
                        ? request.item_name?.toLowerCase().includes(search.toLowerCase())
                        : request.supply?.name.toLowerCase().includes(search.toLowerCase())) ||
                    request.user.name.toLowerCase().includes(search.toLowerCase()) ||
                    request.user.email.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = !statusFilter || request.status === statusFilter;
                return matchesSearch && matchesStatus;
            });
            setFilteredRequests(filtered);
        } else {
            setFilteredRequests(requests);
        }
    }, [requests, search, statusFilter]);

    useEffect(() => {
        if (search || statusFilter || returnDateFilter || sectorFilter || locationFilter || localeFilter || requesterFilter) {
            const filtered = allocationRequests.filter(request => {
                const matchesSearch =
                    request.inventory.name.toLowerCase().includes(search.toLowerCase()) ||
                    request.inventory.model.toLowerCase().includes(search.toLowerCase()) ||
                    request.inventory.serial_number.toLowerCase().includes(search.toLowerCase()) ||
                    request.requester.name.toLowerCase().includes(search.toLowerCase()) ||
                    request.requester.email.toLowerCase().includes(search.toLowerCase()) ||
                    (request.locale_name && request.locale_name.toLowerCase().includes(search.toLowerCase())) ||
                    (request.location_name && request.location_name.toLowerCase().includes(search.toLowerCase())) ||
                    (request.requester_sector && request.requester_sector.toLowerCase().includes(search.toLowerCase()));

                const matchesStatus = !statusFilter || request.status === statusFilter;
                const matchesReturnDate = !returnDateFilter || (request.return_date && new Date(request.return_date).toLocaleDateString('pt-BR') === returnDateFilter);
                const matchesSector = !sectorFilter || (request.requester_sector && request.requester_sector === sectorFilter);
                const matchesLocation = !locationFilter || (request.location_name && request.location_name === locationFilter);
                const matchesLocale = !localeFilter || (request.locale_name && request.locale_name === localeFilter);
                const matchesRequester = !requesterFilter || (request.requester.name && request.requester.name === requesterFilter);

                return matchesSearch && matchesStatus && matchesReturnDate && matchesSector && matchesLocation && matchesLocale && matchesRequester;
            });
            setFilteredAllocationRequests(filtered);
        } else {
            setFilteredAllocationRequests(allocationRequests);
        }
    }, [allocationRequests, search, statusFilter, returnDateFilter, sectorFilter, locationFilter, localeFilter, requesterFilter]);

    useEffect(() => {
        let filtered = inventoryTransactions;

        if (search) {
            filtered = filtered.filter(transaction =>
                transaction.inventory.name.toLowerCase().includes(search.toLowerCase()) ||
                transaction.inventory.model.toLowerCase().includes(search.toLowerCase()) ||
                transaction.inventory.serial_number.toLowerCase().includes(search.toLowerCase()) ||
                transaction.from_user.name.toLowerCase().includes(search.toLowerCase()) ||
                transaction.from_user.email.toLowerCase().includes(search.toLowerCase()) ||
                (transaction.to_user && transaction.to_user.name.toLowerCase().includes(search.toLowerCase())) ||
                (transaction.to_user && transaction.to_user.email.toLowerCase().includes(search.toLowerCase()))
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(transaction => transaction.transaction_type === statusFilter);
        }

        if (transactionLocationFilter) {
            filtered = filtered.filter(transaction =>
                transaction.destination_locale?.location.name === transactionLocationFilter
            );
        }

        if (transactionLocaleFilter) {
            filtered = filtered.filter(transaction =>
                transaction.destination_locale?.name === transactionLocaleFilter
            );
        }

        setFilteredInventoryTransactions(filtered);
    }, [inventoryTransactions, search, statusFilter, returnDateFilter, sectorFilter, locationFilter, localeFilter, requesterFilter, transactionLocationFilter, transactionLocaleFilter]);

    useEffect(() => {
        let filtered = stockMovements;

        if (movementSearch) {
            const query = movementSearch.toLowerCase();
            filtered = filtered.filter(movement =>
                movement.supply?.name.toLowerCase().includes(query) ||
                movement.from_user?.name.toLowerCase().includes(query) ||
                movement.from_user?.email.toLowerCase().includes(query) ||
                movement.to_user?.name.toLowerCase().includes(query) ||
                movement.to_user?.email.toLowerCase().includes(query) ||
                movement.sector?.location?.branch?.toLowerCase().includes(query)
            );
        }

        if (movementTypeFilter) {
            filtered = filtered.filter(movement => movement.movement_type === movementTypeFilter);
        }

        if (movementPoloFilter) {
            filtered = filtered.filter(movement =>
                movement.sector?.location?.branch === movementPoloFilter
            );
        }

        if (movementSectorFilter) {
            filtered = filtered.filter(movement =>
                movement.sector?.name === movementSectorFilter
            );
        }

        if (movementDateFrom || movementDateTo) {
            if (movementDateFrom && movementDateTo && movementDateFrom > movementDateTo) {
                filtered = [];
            } else {
                filtered = filtered.filter(movement => {
                    const date = movement.created_at.slice(0, 10);
                    if (movementDateFrom && date < movementDateFrom) return false;
                    if (movementDateTo && date > movementDateTo) return false;
                    return true;
                });
            }
        }

        setFilteredStockMovements(filtered);
    }, [stockMovements, movementSearch, movementTypeFilter, movementPoloFilter, movementSectorFilter, movementDateFrom, movementDateTo]);

    const movementPoloOptions = useMemo(
        () => [...new Set(
            stockMovements
                .map(movement => movement.sector?.location?.branch?.trim())
                .filter((branch): branch is string => Boolean(branch))
        )].sort(),
        [stockMovements],
    );

    const movementSectorOptions = useMemo(
        () => [...new Set(
            stockMovements
                .map(movement => movement.sector?.name?.trim())
                .filter((name): name is string => Boolean(name))
        )].sort(),
        [stockMovements],
    );

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const allRequests = await fetchAllSupplyRequests(token);
            setRequests(allRequests);
            setFilteredRequests(allRequests);
        } catch (error) {
            if (error instanceof RateLimitError) {
                router.push('/rate-limit');
                return;
            }
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao carregar requisições',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const fetchAllocationRequests = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) return;

            const data = await fetchAllocations(token);
            setAllocationRequests(data);
            setFilteredAllocationRequests(data);
        } catch (error) {
            console.error('Erro ao buscar alocações:', error);
        }
    };

    const loadInventoryTransactions = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) return;

            const data = await fetchInventoryTransactions(token);
            setInventoryTransactions(data);
            setFilteredInventoryTransactions(data);
        } catch (error) {
            console.error('Erro ao buscar transações de inventário:', error);
        }
    };

    const loadStockMovements = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) return;

            const data = await fetchStockMovements(token);
            setStockMovements(data);
            setFilteredStockMovements(data);
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao carregar movimentações',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleStatusUpdate = async (requestId: string, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const request = requests.find(r => r.id === requestId);
            if (!request) {
                throw new Error('Requisição não encontrada');
            }

            await updateRequestStatus(requestId, newStatus, !!request.is_custom, token);

            toast({
                title: 'Sucesso',
                description: `Requisição ${newStatus === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            fetchRequests();
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao atualizar requisição',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRequesterConfirmation = async (requestId: string, confirmation: boolean) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const request = requests.find(r => r.id === requestId);
            if (!request) {
                throw new Error('Requisição não encontrada');
            }

            await updateRequesterConfirmation(requestId, confirmation, token, !!request.is_custom);

            toast({
                title: 'Sucesso',
                description: 'Confirmação atualizada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            fetchRequests();
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

    const handleManagerDeliveryConfirmation = async (
        requestOrAllocation: SupplyRequest | InventoryAllocation,
        confirmation: boolean
    ) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                router.push('/login');
                return;
            }

            if ('inventory' in requestOrAllocation && requestOrAllocation.inventory) {
                await confirmAllocationDelivery(requestOrAllocation.id, confirmation, token);
            } else {
                const request = requestOrAllocation as SupplyRequest;
                await updateManagerDeliveryConfirmation(
                    request.id,
                    confirmation,
                    !!request.is_custom,
                    token
                );
            }

            toast({
                title: 'Sucesso',
                description: 'Confirmação de entrega atualizada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            if ('inventory' in requestOrAllocation && requestOrAllocation.inventory) {
                fetchAllocationRequests();
            } else {
                fetchRequests();
            }
        } catch (error) {
            console.error('Erro ao confirmar entrega:', error);
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao confirmar entrega',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleAllocationStatusUpdate = async (allocationId: string, newStatus: 'APPROVED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                router.push('/login');
                return;
            }

            await updateAllocationStatus(allocationId, newStatus, token);

            toast({
                title: 'Sucesso',
                description: 'Status da alocação atualizado com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            fetchAllocationRequests();
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao atualizar status da alocação',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleAllocationMarkAsLost = async (allocation: InventoryAllocation) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                router.push('/login');
                return;
            }

            await markAllocationLost(allocation.id, token);

            toast({
                title: 'Sucesso',
                description: 'Item marcado como perdido',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchAllocationRequests();
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao marcar item como perdido',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleAllocationManagerReturnConfirmation = async (allocation: InventoryAllocation) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                router.push('/login');
                return;
            }

            await confirmManagerReturn(allocation.id, token);

            toast({
                title: 'Sucesso',
                description: 'Devolução confirmada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchAllocationRequests();
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao confirmar devolução',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const exportToPDF = () => {
        if (filteredRequests.length === 0) {
            toast({
                title: 'Aviso',
                description: 'Não há dados para exportar',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        const doc = new jsPDF();
        // Título do documento
        doc.setFontSize(18);
        doc.text('Relatório de Requisições de Suprimentos', 14, 22);
        // Informações dos filtros aplicados
        doc.setFontSize(10);
        let yPosition = 35;
        const filters = [];
        if (search) filters.push(`Busca: ${search}`);
        if (statusFilter) filters.push(`Status: ${statusFilter}`);
        if (returnDateFilter) filters.push(`Data de Retorno: ${returnDateFilter}`);
        if (sectorFilter) filters.push(`Setor: ${sectorFilter}`);
        if (locationFilter) filters.push(`Filial: ${locationFilter}`);
        if (localeFilter) filters.push(`Local: ${localeFilter}`);
        if (requesterFilter) filters.push(`Requerente: ${requesterFilter}`);
        if (transactionLocationFilter) filters.push(`Filial: ${transactionLocationFilter}`);
        if (transactionLocaleFilter) filters.push(`Local: ${transactionLocaleFilter}`);
        if (filters.length > 0) {
            doc.text('Filtros Aplicados:', 14, yPosition);
            yPosition += 5;
            filters.forEach(filter => {
                doc.text(`• ${filter}`, 20, yPosition);
                yPosition += 4;
            });
            yPosition += 5;
        }
        // Data e hora da exportação
        const now = new Date();
        doc.text(`Exportado em: ${now.toLocaleString('pt-BR')}`, 14, yPosition);
        yPosition += 10;
        // Dados da tabela
        const tableData = filteredRequests.map(request => [
            request.is_custom ? request.item_name || '-' : request.supply?.name || '-',
            request.user.name || '-',
            `${request.quantity} ${request.supply?.unit?.symbol || request.unit?.symbol || ''}`,
            request.status === 'PENDING' ? 'Pendente' : request.status === 'APPROVED' ? 'Aprovado' : request.status === 'REJECTED' ? 'Rejeitado' : request.status === 'CANCELLED' ? 'Cancelado' : 'Entregue',
            request.created_at ? new Date(request.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
            request.delivery_deadline ? new Date(request.delivery_deadline).toLocaleDateString('pt-BR') : '-',
            request.status === 'DELIVERED' && request.updated_at ? new Date(request.updated_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
            request.location?.name || '-',
            request.sector?.name || '-',
            request.locale?.name || '-',
        ]);
        autoTable(doc, {
            head: [['Suprimento', 'Usuário', 'Quantidade', 'Status', 'Data da Solicitação', 'Data Limite de Entrega', 'Data de Entrega', 'Filial', 'Setor', 'Local']],
            body: tableData,
            startY: yPosition,
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            margin: { top: 10 },
        });
        doc.save('requisicoes_suprimentos.pdf');
        toast({
            title: 'Sucesso',
            description: 'PDF exportado com sucesso!',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const exportStockMovementsToPDF = async () => {
        if (filteredStockMovements.length === 0) {
            toast({
                title: 'Aviso',
                description: 'Não há dados para exportar',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            await exportStockMovementsPDF(filteredStockMovements);
            toast({
                title: 'Sucesso',
                description: 'PDF exportado com sucesso!',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao exportar PDF',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const clearMovementFilters = () => {
        setMovementSearch('');
        setMovementTypeFilter('');
        setMovementPoloFilter('');
        setMovementSectorFilter('');
        setMovementDateFrom('');
        setMovementDateTo('');
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('PENDING');
        setReturnDateFilter('');
        setSectorFilter('');
        setLocationFilter('');
        setLocaleFilter('');
        setRequesterFilter('');
        setTransactionLocationFilter('');
        setTransactionLocaleFilter('');
    };

    // faz request ao trocar de aba
    const fetchTabData = async (tabIndex: number, fetchFn: () => Promise<void>) => {
        setLoadingTabs(tabs => tabs.map((v, i) => i === tabIndex ? true : v));
        await fetchFn();
        setLoadingTabs(tabs => tabs.map((v, i) => i === tabIndex ? false : v));
    };

    // Adicionar este efeito para mobile: faz request ao trocar de aba
    useEffect(() => {
        if (isMobile) {
            setLoadingTabs(tabs => tabs.map((v, i) => i === activeTab ? true : v));
            const fetchFns = [() => fetchTabData(0, fetchRequests), () => fetchTabData(1, fetchAllocationRequests), () => fetchTabData(2, loadInventoryTransactions), () => fetchTabData(3, loadStockMovements)];
            fetchFns[activeTab]().finally(() => {
                setLoadingTabs(tabs => tabs.map((v, i) => i === activeTab ? false : v));
            });
        }
        // eslint-disable-next-line
    }, [activeTab, isMobile]);

    if (loading) {
        return (
            <Box p={8}>
                <Flex justify="center" align="center" minH="200px">
                    <Spinner size="xl" />
                </Flex>
            </Box>
        );
    }

    if (isMobile) {
        return (
            <Box position="relative" h="100vh" overflow="hidden" py="0">
                <Box
                    position="fixed"
                    bottom={0}
                    left={0}
                    right={0}
                    zIndex={10}
                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
                    backdropFilter="blur(20px)"
                    borderTop="1px solid"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    p={0}
                    boxShadow="0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -10px 10px -5px rgba(0, 0, 0, 0.04)"
                >
                    <HStack spacing={3} justify="space-around" p={4}>
                        <Button
                            flex={1}
                            variant="ghost"
                            bg={activeTab === 0 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, blue.500, purple.500)' 
                                    : 'linear(to-r, blue.400, purple.400)')
                                : 'transparent'
                            }
                            bgGradient={activeTab === 0 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, blue.500, purple.500)' 
                                    : 'linear(to-r, blue.400, purple.400)')
                                : undefined
                            }
                            color={activeTab === 0 ? 'white' : colorMode === 'dark' ? 'gray.300' : 'gray.600'}
                            onClick={() => setActiveTab(0)}
                            borderRadius="xl"
                            size="md"
                            boxShadow={activeTab === 0 ? 'lg' : 'none'}
                            _hover={{ 
                                bg: activeTab === 0 
                                    ? (colorMode === 'dark' 
                                        ? 'linear(to-r, blue.600, purple.600)' 
                                        : 'linear(to-r, blue.500, purple.500)')
                                    : colorMode === 'dark' ? 'gray.700' : 'gray.100',
                                transform: 'translateY(-2px)',
                                boxShadow: activeTab === 0 ? 'xl' : 'md'
                            }}
                            _active={{ 
                                transform: 'translateY(0px)',
                                boxShadow: activeTab === 0 ? 'lg' : 'sm'
                            }}
                            p={2}
                            minW={0}
                            h="70px"
                            justifyContent="center"
                            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                            position="relative"
                            overflow="hidden"
                        >
                            <VStack spacing={2} align="center">
                                <Package size={22} />
                                <Text fontSize="xs" fontWeight="semibold" textAlign="center">Suprimentos</Text>
                            </VStack>
                            {activeTab === 0 && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    h="4px"
                                    bg="white"
                                    opacity={0.9}
                                    borderRadius="full"
                                    boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                                />
                            )}
                        </Button>
                        <Button
                            flex={1}
                            variant="ghost"
                            bg={activeTab === 1 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, green.500, teal.500)' 
                                    : 'linear(to-r, green.400, teal.400)')
                                : 'transparent'
                            }
                            bgGradient={activeTab === 1 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, green.500, teal.500)' 
                                    : 'linear(to-r, green.400, teal.400)')
                                : undefined
                            }
                            color={activeTab === 1 ? 'white' : colorMode === 'dark' ? 'gray.300' : 'gray.600'}
                            onClick={() => setActiveTab(1)}
                            borderRadius="xl"
                            size="md"
                            boxShadow={activeTab === 1 ? 'lg' : 'none'}
                            _hover={{ 
                                bg: activeTab === 1 
                                    ? (colorMode === 'dark' 
                                        ? 'linear(to-r, green.600, teal.600)' 
                                        : 'linear(to-r, green.500, teal.500)')
                                    : colorMode === 'dark' ? 'gray.700' : 'gray.100',
                                transform: 'translateY(-2px)',
                                boxShadow: activeTab === 1 ? 'xl' : 'md'
                            }}
                            _active={{ 
                                transform: 'translateY(0px)',
                                boxShadow: activeTab === 1 ? 'lg' : 'sm'
                            }}
                            p={2}
                            minW={0}
                            h="70px"
                            justifyContent="center"
                            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                            position="relative"
                            overflow="hidden"
                        >
                            <VStack spacing={2} align="center">
                                <ClipboardList size={22} />
                                <Text fontSize="xs" fontWeight="semibold" textAlign="center">Alocações</Text>
                            </VStack>
                            {activeTab === 1 && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    h="4px"
                                    bg="white"
                                    opacity={0.9}
                                    borderRadius="full"
                                    boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                                />
                            )}
                        </Button>
                        <Button
                            flex={1}
                            variant="ghost"
                            bg={activeTab === 2 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, orange.500, red.500)' 
                                    : 'linear(to-r, orange.400, red.400)')
                                : 'transparent'
                            }
                            bgGradient={activeTab === 2 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, orange.500, red.500)' 
                                    : 'linear(to-r, orange.400, red.400)')
                                : undefined
                            }
                            color={activeTab === 2 ? 'white' : colorMode === 'dark' ? 'gray.300' : 'gray.600'}
                            onClick={() => setActiveTab(2)}
                            borderRadius="xl"
                            size="md"
                            boxShadow={activeTab === 2 ? 'lg' : 'none'}
                            _hover={{ 
                                bg: activeTab === 2 
                                    ? (colorMode === 'dark' 
                                        ? 'linear(to-r, orange.600, red.600)' 
                                        : 'linear(to-r, orange.500, red.500)')
                                    : colorMode === 'dark' ? 'gray.700' : 'gray.100',
                                transform: 'translateY(-2px)',
                                boxShadow: activeTab === 2 ? 'xl' : 'md'
                            }}
                            _active={{ 
                                transform: 'translateY(0px)',
                                boxShadow: activeTab === 2 ? 'lg' : 'sm'
                            }}
                            p={2}
                            minW={0}
                            h="70px"
                            justifyContent="center"
                            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                            position="relative"
                            overflow="hidden"
                        >
                            <VStack spacing={2} align="center">
                                <BarChart3 size={22} />
                                <Text fontSize="xs" fontWeight="semibold" textAlign="center">Inventário</Text>
                            </VStack>
                            {activeTab === 2 && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    h="4px"
                                    bg="white"
                                    opacity={0.9}
                                    borderRadius="full"
                                    boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                                />
                            )}
                        </Button>
                        <Button
                            flex={1}
                            variant="ghost"
                            bg={activeTab === 3 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, purple.500, pink.500)' 
                                    : 'linear(to-r, purple.400, pink.400)')
                                : 'transparent'
                            }
                            bgGradient={activeTab === 3 
                                ? (colorMode === 'dark' 
                                    ? 'linear(to-r, purple.500, pink.500)' 
                                    : 'linear(to-r, purple.400, pink.400)')
                                : undefined
                            }
                            color={activeTab === 3 ? 'white' : colorMode === 'dark' ? 'gray.300' : 'gray.600'}
                            onClick={() => setActiveTab(3)}
                            borderRadius="xl"
                            size="md"
                            boxShadow={activeTab === 3 ? 'lg' : 'none'}
                            _hover={{ 
                                bg: activeTab === 3 
                                    ? (colorMode === 'dark' 
                                        ? 'linear(to-r, purple.600, pink.600)' 
                                        : 'linear(to-r, purple.500, pink.500)')
                                    : colorMode === 'dark' ? 'gray.700' : 'gray.100',
                                transform: 'translateY(-2px)',
                                boxShadow: activeTab === 3 ? 'xl' : 'md'
                            }}
                            _active={{ 
                                transform: 'translateY(0px)',
                                boxShadow: activeTab === 3 ? 'lg' : 'sm'
                            }}
                            p={2}
                            minW={0}
                            h="70px"
                            justifyContent="center"
                            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                            position="relative"
                            overflow="hidden"
                        >
                            <VStack spacing={2} align="center">
                                <TrendingUp size={22} />
                                <Text fontSize="xs" fontWeight="semibold" textAlign="center">Movimentações</Text>
                            </VStack>
                            {activeTab === 3 && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    h="4px"
                                    bg="white"
                                    opacity={0.9}
                                    borderRadius="full"
                                    boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                                />
                            )}
                        </Button>
                    </HStack>
                </Box>
                <Box pt={4} pb="90px" h="100vh" overflowY="auto" px={4}>
                    <Box
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                        backdropFilter="blur(20px)"
                        borderRadius="2xl"
                        p={4}
                        boxShadow="lg"
                        border="1px solid"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        minH="calc(100vh - 120px)"
                    >
                    {[
                        loadingTabs[0] ? (
                            <Skeleton key="skeleton-req" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                        ) : (
                            <SupplyRequestsTab
                                key="suprimentos"
                                requests={requests}
                                filteredRequests={filteredRequests}
                                search={search}
                                onSearchChange={setSearch}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                onApprove={handleStatusUpdate}
                                onReject={handleStatusUpdate}
                                onConfirmDelivery={handleManagerDeliveryConfirmation}
                                onExportPDF={exportToPDF}
                                onClearFilters={clearFilters}
                                onRefresh={fetchRequests}
                                isMobile={true}
                            />
                        ),
                        loadingTabs[1] ? (
                            <Skeleton key="skeleton-alloc" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                        ) : (
                            <AllocationsTab
                                key="alocacoes"
                                allocationRequests={allocationRequests}
                                filteredAllocationRequests={filteredAllocationRequests}
                                search={search}
                                onSearchChange={setSearch}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                returnDateFilter={returnDateFilter}
                                onReturnDateFilterChange={setReturnDateFilter}
                                sectorFilter={sectorFilter}
                                onSectorFilterChange={setSectorFilter}
                                locationFilter={locationFilter}
                                onLocationFilterChange={setLocationFilter}
                                localeFilter={localeFilter}
                                onLocaleFilterChange={setLocaleFilter}
                                requesterFilter={requesterFilter}
                                onRequesterFilterChange={setRequesterFilter}
                                onAllocationApprove={handleAllocationStatusUpdate}
                                onAllocationReject={handleAllocationStatusUpdate}
                                onAllocationConfirmDelivery={handleManagerDeliveryConfirmation}
                                onAllocationManagerReturnConfirmation={handleAllocationManagerReturnConfirmation}
                                onAllocationMarkAsLost={handleAllocationMarkAsLost}
                                onExportPDF={exportToPDF}
                                onClearFilters={clearFilters}
                                onRefresh={fetchAllocationRequests}
                                isMobile={true}
                            />
                        ),
                        loadingTabs[2] ? (
                            <Skeleton key="skeleton-inv" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                        ) : (
                            <InventoryTransactionsTab
                                key="transacoes-inventario"
                                inventoryTransactions={inventoryTransactions}
                                filteredInventoryTransactions={filteredInventoryTransactions}
                                search={search}
                                onSearchChange={setSearch}
                                statusFilter={statusFilter}
                                onStatusFilterChange={setStatusFilter}
                                transactionLocationFilter={transactionLocationFilter}
                                onTransactionLocationFilterChange={setTransactionLocationFilter}
                                transactionLocaleFilter={transactionLocaleFilter}
                                onTransactionLocaleFilterChange={setTransactionLocaleFilter}
                                onExportPDF={exportToPDF}
                                onClearFilters={clearFilters}
                                onRefresh={loadInventoryTransactions}
                                isMobile={true}
                            />
                        ),
                        loadingTabs[3] ? (
                            <Skeleton key="skeleton-supply" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                        ) : (
                            <StockMovementsTab
                                key="movimentacoes-estoque"
                                stockMovements={stockMovements}
                                filteredStockMovements={filteredStockMovements}
                                movementSearch={movementSearch}
                                onMovementSearchChange={setMovementSearch}
                                movementTypeFilter={movementTypeFilter}
                                onMovementTypeFilterChange={setMovementTypeFilter}
                                movementPoloFilter={movementPoloFilter}
                                onMovementPoloFilterChange={setMovementPoloFilter}
                                movementSectorFilter={movementSectorFilter}
                                onMovementSectorFilterChange={setMovementSectorFilter}
                                movementDateFrom={movementDateFrom}
                                onMovementDateFromChange={setMovementDateFrom}
                                movementDateTo={movementDateTo}
                                onMovementDateToChange={setMovementDateTo}
                                poloOptions={movementPoloOptions}
                                sectorOptions={movementSectorOptions}
                                onExportPDF={exportStockMovementsToPDF}
                                onClearFilters={clearMovementFilters}
                                onRefresh={loadStockMovements}
                                isMobile={true}
                            />
                        )
                    ][activeTab]}
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <PersistentTabsLayout
            tabLabels={["Suprimentos", "Alocações", "Transações de Inventário", "Movimentações de Estoque"]}
            onTabChange={[() => fetchTabData(0, fetchRequests), () => fetchTabData(1, fetchAllocationRequests), () => fetchTabData(2, loadInventoryTransactions), () => fetchTabData(3, loadStockMovements)]}
        >
            {[
                loadingTabs[0] ? (
                    <Skeleton key="skeleton-req" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                ) : (
                    <SupplyRequestsTab
                        key="suprimentos"
                        requests={requests}
                        filteredRequests={filteredRequests}
                        search={search}
                        onSearchChange={setSearch}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        onApprove={handleStatusUpdate}
                        onReject={handleStatusUpdate}
                        onConfirmDelivery={handleManagerDeliveryConfirmation}
                        onExportPDF={exportToPDF}
                        onClearFilters={clearFilters}
                        onRefresh={fetchRequests}
                    />
                ),
                loadingTabs[1] ? (
                    <Skeleton key="skeleton-alloc" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                ) : (
                    <AllocationsTab
                        key="alocacoes"
                        allocationRequests={allocationRequests}
                        filteredAllocationRequests={filteredAllocationRequests}
                        search={search}
                        onSearchChange={setSearch}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        returnDateFilter={returnDateFilter}
                        onReturnDateFilterChange={setReturnDateFilter}
                        sectorFilter={sectorFilter}
                        onSectorFilterChange={setSectorFilter}
                        locationFilter={locationFilter}
                        onLocationFilterChange={setLocationFilter}
                        localeFilter={localeFilter}
                        onLocaleFilterChange={setLocaleFilter}
                        requesterFilter={requesterFilter}
                        onRequesterFilterChange={setRequesterFilter}
                        onAllocationApprove={handleAllocationStatusUpdate}
                        onAllocationReject={handleAllocationStatusUpdate}
                        onAllocationConfirmDelivery={handleManagerDeliveryConfirmation}
                        onAllocationManagerReturnConfirmation={handleAllocationManagerReturnConfirmation}
                        onAllocationMarkAsLost={handleAllocationMarkAsLost}
                        onExportPDF={exportToPDF}
                        onClearFilters={clearFilters}
                        onRefresh={fetchAllocationRequests}
                    />
                ),
                loadingTabs[2] ? (
                    <Skeleton key="skeleton-inv" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                ) : (
                    <InventoryTransactionsTab
                        key="transacoes-inventario"
                        inventoryTransactions={inventoryTransactions}
                        filteredInventoryTransactions={filteredInventoryTransactions}
                        search={search}
                        onSearchChange={setSearch}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        transactionLocationFilter={transactionLocationFilter}
                        onTransactionLocationFilterChange={setTransactionLocationFilter}
                        transactionLocaleFilter={transactionLocaleFilter}
                        onTransactionLocaleFilterChange={setTransactionLocaleFilter}
                        onExportPDF={exportToPDF}
                        onClearFilters={clearFilters}
                        onRefresh={loadInventoryTransactions}
                    />
                ),
                loadingTabs[3] ? (
                    <Skeleton key="skeleton-supply" height="400px"><SkeletonText mt="4" noOfLines={8} spacing="4" /></Skeleton>
                ) : (
                    <StockMovementsTab
                        key="movimentacoes-estoque"
                        stockMovements={stockMovements}
                        filteredStockMovements={filteredStockMovements}
                        movementSearch={movementSearch}
                        onMovementSearchChange={setMovementSearch}
                        movementTypeFilter={movementTypeFilter}
                        onMovementTypeFilterChange={setMovementTypeFilter}
                        movementPoloFilter={movementPoloFilter}
                        onMovementPoloFilterChange={setMovementPoloFilter}
                        movementSectorFilter={movementSectorFilter}
                        onMovementSectorFilterChange={setMovementSectorFilter}
                        movementDateFrom={movementDateFrom}
                        onMovementDateFromChange={setMovementDateFrom}
                        movementDateTo={movementDateTo}
                        onMovementDateToChange={setMovementDateTo}
                        poloOptions={movementPoloOptions}
                        sectorOptions={movementSectorOptions}
                        onExportPDF={exportStockMovementsToPDF}
                        onClearFilters={clearMovementFilters}
                        onRefresh={loadStockMovements}
                    />
                )
            ]}
        </PersistentTabsLayout>
    );
} 