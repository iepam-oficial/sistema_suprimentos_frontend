'use client';

import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Button,
    Input,
    Select,
    Text,
    Flex,
    VStack,
    HStack,
    useColorModeValue,
    Image,
    FormControl,
    FormLabel,
    useDisclosure,
    useColorMode,
} from '@chakra-ui/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SupplyRequest } from '../../types';
import { AdminTabShell } from './AdminTabShell';
import { AdminTabToolbar } from './AdminTabToolbar';
import { AdminFiltersDrawer } from './AdminFiltersDrawer';
import { DemandSupplyDrawer } from './DemandSupplyDrawer';
import { DemandSupplyListTab } from './DemandSupplyListTab';
import {
    SupplyRequestsViewToggle,
    SUPPLY_REQUESTS_VIEW_MODE_STORAGE_KEY,
    type SupplyRequestsViewMode,
} from './SupplyRequestsViewToggle';

function isLegacySupplyRequest(request: SupplyRequest): boolean {
    return request.demand_supply_id == null;
}

interface SupplyRequestsTabProps {
    requests: SupplyRequest[];
    filteredRequests: SupplyRequest[];
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    onApprove: (id: string, status: 'APPROVED' | 'REJECTED') => void;
    onReject: (id: string, status: 'APPROVED' | 'REJECTED') => void;
    onConfirmDelivery: (request: SupplyRequest, confirmation: boolean) => void;
    onExportPDF: () => void;
    onClearFilters: () => void;
    onRefresh: () => void;
    isMobile?: boolean;
}

export function SupplyRequestsTab({
    filteredRequests,
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onApprove,
    onReject,
    onConfirmDelivery,
    onExportPDF,
    onClearFilters,
    onRefresh,
    isMobile = false,
}: SupplyRequestsTabProps) {
    const { colorMode } = useColorMode();
    const colorModeVal = useColorModeValue('light', 'dark');
    const [deliveryDeadlineStart, setDeliveryDeadlineStart] = useState('');
    const [deliveryDeadlineEnd, setDeliveryDeadlineEnd] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [localeFilter, setLocaleFilter] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDemandSupplyId, setSelectedDemandSupplyId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<SupplyRequestsViewMode>('per-order');

    useEffect(() => {
        const saved = localStorage.getItem(SUPPLY_REQUESTS_VIEW_MODE_STORAGE_KEY);
        if (saved === 'per-order' || saved === 'per-item') {
            setViewMode(saved);
        }
    }, []);

    const handleViewModeChange = (mode: SupplyRequestsViewMode) => {
        setViewMode(mode);
        localStorage.setItem(SUPPLY_REQUESTS_VIEW_MODE_STORAGE_KEY, mode);
    };

    const showPerItemView = viewMode === 'per-item';
    const viewToggle = (
        <SupplyRequestsViewToggle value={viewMode} onChange={handleViewModeChange} />
    );

    const handleOpenDrawer = (id: string) => {
        setSelectedDemandSupplyId(id);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedDemandSupplyId(null);
    };

    const inputBg = colorMode === 'dark' ? 'gray.700' : 'white';
    const inputBorder = colorMode === 'dark' ? 'gray.600' : 'gray.200';
    const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
    const thBg = colorMode === 'dark' ? 'gray.700' : 'gray.50';
    const thColor = colorMode === 'dark' ? 'gray.300' : 'gray.600';

    const filtersActive = Boolean(
        statusFilter ||
        deliveryDeadlineStart ||
        deliveryDeadlineEnd ||
        locationFilter ||
        sectorFilter ||
        localeFilter
    );

    const handleClearFilters = () => {
        onClearFilters();
        setLocationFilter('');
        setSectorFilter('');
        setLocaleFilter('');
        setDeliveryDeadlineStart('');
        setDeliveryDeadlineEnd('');
        onSearchChange('');
    };

    const legacyRequests = filteredRequests.filter(isLegacySupplyRequest);

    const filtered = legacyRequests
        .filter((r) => {
            if (!deliveryDeadlineStart && !deliveryDeadlineEnd) return true;
            if (!r.delivery_deadline) return false;
            const deadline = new Date(r.delivery_deadline);
            const start = deliveryDeadlineStart ? new Date(deliveryDeadlineStart) : null;
            const end = deliveryDeadlineEnd ? new Date(deliveryDeadlineEnd) : null;
            if (start && end) return deadline >= start && deadline <= end;
            if (start) return deadline >= start;
            if (end) return deadline <= end;
            return true;
        })
        .filter((r) => !locationFilter || (r.location?.name && r.location.name === locationFilter))
        .filter((r) => !sectorFilter || (r.sector?.name && r.sector.name === sectorFilter))
        .filter((r) => !localeFilter || (r.locale?.name && r.locale.name === localeFilter));

    const toolbarActions = (
        <>
            {viewToggle}
            <Button size="sm" onClick={onExportPDF} colorScheme="blue" isDisabled={filtered.length === 0}>
                Exportar PDF
            </Button>
            <Button size="sm" onClick={onRefresh} colorScheme="blue">
                Atualizar
            </Button>
            <Button size="sm" onClick={handleClearFilters} colorScheme="gray" variant="outline">
                Limpar Filtros
            </Button>
        </>
    );

    const filterFields = (
        <>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Status</FormLabel>
                <Select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos os status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="REJECTED">Rejeitado</option>
                    <option value="DELIVERED">Entregue</option>
                    <option value="CANCELLED">Cancelado</option>
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Data limite entrega (início)</FormLabel>
                <Input type="date" value={deliveryDeadlineStart} onChange={(e) => setDeliveryDeadlineStart(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm" />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Data limite entrega (fim)</FormLabel>
                <Input type="date" value={deliveryDeadlineEnd} onChange={(e) => setDeliveryDeadlineEnd(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm" />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Filial</FormLabel>
                <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todas</option>
                    {Array.from(new Set(legacyRequests.map((r) => r.location?.name).filter(Boolean))).map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Setor</FormLabel>
                <Select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todos</option>
                    {Array.from(new Set(legacyRequests.map((r) => r.sector?.name).filter(Boolean))).map((sector) => (
                        <option key={sector} value={sector}>{sector}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Local de entrega</FormLabel>
                <Select value={localeFilter} onChange={(e) => setLocaleFilter(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todos</option>
                    {Array.from(new Set(legacyRequests.map((r) => r.locale?.name).filter(Boolean))).map((locale) => (
                        <option key={locale} value={locale}>{locale}</option>
                    ))}
                </Select>
            </FormControl>
        </>
    );

    const emptyState = (
        <Flex direction="column" align="center" justify="center" py={8} h="full">
            <Image src="/Task-complete.svg" alt="Nenhuma requisição encontrada" maxW={isMobile ? '200px' : '300px'} mb={4} />
            <Text color={colorModeVal === 'dark' ? 'gray.300' : 'gray.500'} fontSize={isMobile ? 'md' : 'lg'}>
                Nenhuma requisição encontrada
            </Text>
        </Flex>
    );

    const mobileCards = (
        <VStack spacing={3} align="stretch" p={2}>
            {filtered.map((request) => (
                <Box key={request.id} p={2} borderRadius="md" boxShadow="sm" bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}>
                    <Text fontWeight="bold">{request.is_custom ? request.item_name : request.supply?.name}</Text>
                    <Text fontSize="sm" color="gray.500">{request.user.name} - {request.user.email}</Text>
                    <Text fontSize="sm">Qtd: {request.quantity} {request.supply?.unit?.symbol || request.unit?.symbol}</Text>
                    <Badge colorScheme={request.status === 'APPROVED' ? 'green' : request.status === 'REJECTED' ? 'red' : request.status === 'DELIVERED' ? 'purple' : request.status === 'CANCELLED' ? 'gray' : 'yellow'} mt={1} mb={1}>
                        {request.status === 'PENDING' ? 'Pendente' : request.status === 'APPROVED' ? 'Aprovado' : request.status === 'REJECTED' ? 'Rejeitado' : request.status === 'CANCELLED' ? 'Cancelado' : 'Entregue'}
                    </Badge>
                    <Text fontSize="xs" color="gray.400">Data: {new Date(request.created_at).toLocaleDateString('pt-BR')}</Text>
                    <VStack spacing={2} mt={2} align="stretch">
                        {request.status === 'PENDING' && (
                            <HStack>
                                <Button size="sm" colorScheme="green" flex={1} onClick={() => onApprove(request.id, 'APPROVED')}>Aprovar</Button>
                                <Button size="sm" colorScheme="red" flex={1} onClick={() => onReject(request.id, 'REJECTED')}>Rejeitar</Button>
                            </HStack>
                        )}
                        {request.status === 'APPROVED' && !request.manager_delivery_confirmation && (
                            <Button size="sm" colorScheme="blue" w="full" onClick={() => onConfirmDelivery(request, true)}>Confirmar Entrega</Button>
                        )}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );

    const desktopTable = (
        <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} zIndex={1}>
                <Tr>
                    <Th py={2} color={thColor} bg={thBg}>Suprimento</Th>
                    <Th py={2} color={thColor} bg={thBg}>Usuário</Th>
                    <Th py={2} color={thColor} bg={thBg}>Quantidade</Th>
                    <Th py={2} color={thColor} bg={thBg}>Status</Th>
                    <Th py={2} color={thColor} bg={thBg}>Data da Solicitação</Th>
                    <Th py={2} color={thColor} bg={thBg}>Data Limite de Entrega</Th>
                    <Th py={2} color={thColor} bg={thBg}>Data de Entrega</Th>
                    <Th py={2} color={thColor} bg={thBg}>Local de Entrega</Th>
                    <Th py={2} color={thColor} bg={thBg}>Ações</Th>
                </Tr>
            </Thead>
            <Tbody>
                {filtered.map((request) => (
                    <Tr key={request.id} _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'gray.50' }}>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{request.is_custom ? request.item_name : request.supply?.name}</Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">{request.user.name}</Text>
                            <Text fontSize="xs" color="gray.500">{request.user.email}</Text>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{request.quantity} {request.supply?.unit?.symbol || request.supply?.unit?.name}</Td>
                        <Td py={1.5} px={2}>
                            <Badge colorScheme={request.status === 'APPROVED' ? 'green' : request.status === 'REJECTED' ? 'red' : request.status === 'DELIVERED' ? 'purple' : request.status === 'CANCELLED' ? 'gray' : 'yellow'}>
                                {request.status === 'PENDING' ? 'Pendente' : request.status === 'APPROVED' ? 'Aprovado' : request.status === 'REJECTED' ? 'Rejeitado' : request.status === 'CANCELLED' ? 'Cancelado' : 'Entregue'}
                            </Badge>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{new Date(request.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{request.delivery_deadline ? new Date(request.delivery_deadline).toLocaleDateString('pt-BR') : '-'}</Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{request.status === 'DELIVERED' && request.updated_at ? new Date(request.updated_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}</Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{request.locale?.name || '-'}</Td>
                        <Td py={1.5} px={2}>
                            <VStack spacing={1} align="start">
                                <HStack>
                                    <Text fontSize="xs">Requerente:</Text>
                                    <Badge size="sm" colorScheme={request.requester_confirmation ? 'green' : 'gray'}>{request.requester_confirmation ? 'Confirmado' : 'Pendente'}</Badge>
                                </HStack>
                                <HStack>
                                    <Text fontSize="xs">Gerente:</Text>
                                    <Badge size="sm" colorScheme={request.manager_delivery_confirmation ? 'green' : 'gray'}>{request.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}</Badge>
                                </HStack>
                                {request.status === 'PENDING' && (
                                    <HStack spacing={1} mt={1}>
                                        <Button size="xs" colorScheme="green" leftIcon={<CheckCircle size={12} />} onClick={() => onApprove(request.id, 'APPROVED')}>Aprovar</Button>
                                        <Button size="xs" colorScheme="red" leftIcon={<XCircle size={12} />} onClick={() => onReject(request.id, 'REJECTED')}>Rejeitar</Button>
                                    </HStack>
                                )}
                                {request.status === 'APPROVED' && !request.manager_delivery_confirmation && (
                                    <Button size="xs" colorScheme="blue" leftIcon={<CheckCircle size={12} />} onClick={() => onConfirmDelivery(request, true)}>Confirmar Entrega</Button>
                                )}
                            </VStack>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );

    if (!showPerItemView) {
        return (
            <>
                <DemandSupplyListTab
                    onOpenDrawer={handleOpenDrawer}
                    isMobile={isMobile}
                    extraToolbarActions={viewToggle}
                />
                <DemandSupplyDrawer
                    isOpen={drawerOpen}
                    onClose={handleCloseDrawer}
                    demandSupplyId={selectedDemandSupplyId}
                    placement={isMobile ? 'bottom' : 'right'}
                />
            </>
        );
    }

    return (
        <>
            <AdminTabShell
                scrollContent={filtered.length === 0 ? emptyState : isMobile ? mobileCards : desktopTable}
            >
                <AdminTabToolbar
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    searchPlaceholder={isMobile ? 'Buscar suprimentos ou usuário...' : 'Buscar por suprimento ou usuário...'}
                    filtersActive={filtersActive}
                    onFilterOpen={onOpen}
                    actions={toolbarActions}
                    isMobile={isMobile}
                />
            </AdminTabShell>
            <AdminFiltersDrawer
                isOpen={isOpen}
                onClose={onClose}
                placement={isMobile ? 'bottom' : 'right'}
                filtersActive={filtersActive}
                onClearFilters={handleClearFilters}
            >
                {filterFields}
            </AdminFiltersDrawer>
        </>
    );
}
