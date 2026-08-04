'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Box,
    useToast,
    Spinner,
    Flex,
    useMediaQuery,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
    SupplyRequestsTab,
    AllocationsTab,
    InventoryTransactionsTab,
    StockMovementsTab,
    AdminTabSkeleton,
} from './components';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportStockMovementsPDF } from './utils/exportStockMovementsPDF';
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
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    // Estados de loading para cada aba
    const [loadingTabs, setLoadingTabs] = useState([true, true, true, true]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('persistentTabIndex');
        if (saved) setActiveTab(Number(saved));
    }, []);

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
        Promise.all([fetchRequests(), fetchAllocationRequests(), loadInventoryTransactions(), loadStockMovements()]).finally(() => {
            setLoading(false);
            setLoadingTabs([false, false, false, false]);
        });
    }, []);

    useEffect(() => {
        if (search || statusFilter) {
            const filtered = requests.filter(request => {
                const matchesSearch =
                    request.supply?.name.toLowerCase().includes(search.toLowerCase()) ||
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

            await updateRequestStatus(requestId, newStatus, token);

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

            await updateRequesterConfirmation(requestId, confirmation, token);

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
            request.supply?.name || '-',
            request.user.name || '-',
            `${request.quantity} ${request.supply?.unit?.symbol || request.supply?.unit?.name || ''}`,
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

    const handleTabChange = (index: number) => {
        setActiveTab(index);
        localStorage.setItem('persistentTabIndex', String(index));
        const fetchFns = [
            () => fetchTabData(0, fetchRequests),
            () => fetchTabData(1, fetchAllocationRequests),
            () => fetchTabData(2, loadInventoryTransactions),
            () => fetchTabData(3, loadStockMovements),
        ];
        fetchFns[index]();
    };

    if (loading) {
        return (
            <Box p={8}>
                <Flex justify="center" align="center" minH="200px">
                    <Spinner size="xl" />
                </Flex>
            </Box>
        );
    }

    const tabProps = { isMobile };

    return (
        <Box h="100vh" display="flex" flexDirection="column" overflow="hidden" px={2} py={2}>
            <Tabs
                variant="enclosed"
                colorScheme="blue"
                size="sm"
                flex="1"
                display="flex"
                flexDirection="column"
                minH={0}
                index={activeTab}
                onChange={handleTabChange}
            >
                <TabList flexShrink={0}>
                    <Tab data-testid="admin-tab-suprimentos">Suprimentos</Tab>
                    <Tab data-testid="admin-tab-alocacoes">Alocações</Tab>
                    <Tab data-testid="admin-tab-transacoes">Transações de Inventário</Tab>
                    <Tab data-testid="admin-tab-movimentacoes">Movimentações de Estoque</Tab>
                </TabList>
                <TabPanels flex="1" minH={0} overflow="hidden">
                    <TabPanel p={2} h="full" display="flex" flexDirection="column" minH={0}>
                        {loadingTabs[0] ? (
                            <AdminTabSkeleton />
                        ) : (
                            <SupplyRequestsTab
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
                                {...tabProps}
                            />
                        )}
                    </TabPanel>
                    <TabPanel p={2} h="full" display="flex" flexDirection="column" minH={0}>
                        {loadingTabs[1] ? (
                            <AdminTabSkeleton />
                        ) : (
                            <AllocationsTab
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
                                {...tabProps}
                            />
                        )}
                    </TabPanel>
                    <TabPanel p={2} h="full" display="flex" flexDirection="column" minH={0}>
                        {loadingTabs[2] ? (
                            <AdminTabSkeleton />
                        ) : (
                            <InventoryTransactionsTab
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
                                {...tabProps}
                            />
                        )}
                    </TabPanel>
                    <TabPanel p={2} h="full" display="flex" flexDirection="column" minH={0}>
                        {loadingTabs[3] ? (
                            <AdminTabSkeleton />
                        ) : (
                            <StockMovementsTab
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
                                {...tabProps}
                            />
                        )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}
