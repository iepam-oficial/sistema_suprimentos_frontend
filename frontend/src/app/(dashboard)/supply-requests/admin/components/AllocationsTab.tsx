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
import { useState } from 'react';
import type { InventoryAllocation } from '@/features/inventory/types';
import { AdminTabShell } from './AdminTabShell';
import { AdminTabToolbar } from './AdminTabToolbar';
import { AdminFiltersDrawer } from './AdminFiltersDrawer';

interface AllocationsTabProps {
    allocationRequests: InventoryAllocation[];
    filteredAllocationRequests: InventoryAllocation[];
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    returnDateFilter: string;
    onReturnDateFilterChange: (value: string) => void;
    sectorFilter: string;
    onSectorFilterChange: (value: string) => void;
    locationFilter: string;
    onLocationFilterChange: (value: string) => void;
    localeFilter: string;
    onLocaleFilterChange: (value: string) => void;
    requesterFilter: string;
    onRequesterFilterChange: (value: string) => void;
    onAllocationApprove: (id: string, status: 'APPROVED' | 'REJECTED') => void;
    onAllocationReject: (id: string, status: 'APPROVED' | 'REJECTED') => void;
    onAllocationConfirmDelivery: (request: any, confirmation: boolean) => void;
    onAllocationManagerReturnConfirmation: (request: InventoryAllocation) => void;
    onAllocationMarkAsLost: (request: InventoryAllocation) => void;
    onExportPDF: () => void;
    onClearFilters: () => void;
    onRefresh: () => void;
    isMobile?: boolean;
}

export function AllocationsTab({
    allocationRequests,
    filteredAllocationRequests,
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    sectorFilter,
    onSectorFilterChange,
    locationFilter,
    onLocationFilterChange,
    localeFilter,
    onLocaleFilterChange,
    requesterFilter,
    onRequesterFilterChange,
    onAllocationApprove,
    onAllocationReject,
    onAllocationConfirmDelivery,
    onAllocationManagerReturnConfirmation,
    onAllocationMarkAsLost,
    onExportPDF,
    onClearFilters,
    onRefresh,
    isMobile = false,
}: AllocationsTabProps) {
    const { colorMode } = useColorMode();
    const colorModeVal = useColorModeValue('light', 'dark');
    const [returnStart, setReturnStart] = useState('');
    const [returnEnd, setReturnEnd] = useState('');
    const [overdueFilter, setOverdueFilter] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const inputBg = colorMode === 'dark' ? 'gray.700' : 'white';
    const inputBorder = colorMode === 'dark' ? 'gray.600' : 'gray.200';
    const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
    const thBg = colorMode === 'dark' ? 'gray.700' : 'gray.50';
    const thColor = colorMode === 'dark' ? 'gray.300' : 'gray.600';

    const filtersActive = Boolean(
        statusFilter ||
        returnStart ||
        returnEnd ||
        overdueFilter ||
        sectorFilter ||
        locationFilter ||
        localeFilter ||
        requesterFilter
    );

    const handleClearFilters = () => {
        onClearFilters();
        setReturnStart('');
        setReturnEnd('');
        setOverdueFilter(false);
        onSearchChange('');
    };

    const formatDeadline = (deadline: string | null | undefined) => {
        if (!deadline) return '—';
        return new Date(deadline).toLocaleDateString('pt-BR');
    };

    const filtered = filteredAllocationRequests.filter((r) => {
        if (overdueFilter && !r.is_overdue) return false;
        if (!returnStart && !returnEnd) return true;
        if (!r.return_date) return false;
        const ret = new Date(r.return_date);
        const start = returnStart ? new Date(returnStart) : null;
        const end = returnEnd ? new Date(returnEnd) : null;
        if (start && end) return ret >= start && ret <= end;
        if (start) return ret >= start;
        if (end) return ret <= end;
        return true;
    });

    const getStatusLabel = (status: string) => {
        if (status === 'PENDING') return 'Pendente';
        if (status === 'APPROVED') return 'Aprovado';
        if (status === 'REJECTED') return 'Rejeitado';
        if (status === 'DELIVERED') return 'Entregue';
        if (status === 'LOST') return 'Perdido';
        return 'Devolvido';
    };

    const getStatusColorScheme = (status: string) => {
        if (status === 'APPROVED') return 'green';
        if (status === 'REJECTED') return 'red';
        if (status === 'DELIVERED') return 'purple';
        if (status === 'RETURNED') return 'blue';
        if (status === 'LOST') return 'purple';
        return 'yellow';
    };

    const toolbarActions = (
        <>
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
                    <option value="RETURNED">Devolvido</option>
                    <option value="LOST">Perdido</option>
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Atraso</FormLabel>
                <Select
                    value={overdueFilter ? 'overdue' : ''}
                    onChange={(e) => setOverdueFilter(e.target.value === 'overdue')}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todas</option>
                    <option value="overdue">Atrasadas</option>
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Retorno (início)</FormLabel>
                <Input type="date" value={returnStart} onChange={(e) => setReturnStart(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm" />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Retorno (fim)</FormLabel>
                <Input type="date" value={returnEnd} onChange={(e) => setReturnEnd(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm" />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Setor</FormLabel>
                <Select value={sectorFilter} onChange={(e) => onSectorFilterChange(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todos</option>
                    {Array.from(new Set(allocationRequests.map((r) => r.requester_sector).filter(Boolean))).map((sector) => (
                        <option key={sector} value={sector}>{sector}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Filial</FormLabel>
                <Select value={locationFilter} onChange={(e) => onLocationFilterChange(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todas</option>
                    {Array.from(new Set(allocationRequests.map((r) => r.location_name).filter(Boolean))).map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Local</FormLabel>
                <Select value={localeFilter} onChange={(e) => onLocaleFilterChange(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todos</option>
                    {Array.from(new Set(allocationRequests.map((r) => r.locale_name).filter(Boolean))).map((locale) => (
                        <option key={locale} value={locale}>{locale}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Solicitante</FormLabel>
                <Select value={requesterFilter} onChange={(e) => onRequesterFilterChange(e.target.value)} bg={inputBg} borderColor={inputBorder} size="sm">
                    <option value="">Todos</option>
                    {Array.from(new Set(allocationRequests.map((r) => r.requester?.name).filter(Boolean))).map((req) => (
                        <option key={req} value={req}>{req}</option>
                    ))}
                </Select>
            </FormControl>
        </>
    );

    const emptyState = (
        <Flex direction="column" align="center" justify="center" py={8} h="full">
            <Image src="/Task-complete.svg" alt="Nenhuma alocação encontrada" maxW={isMobile ? '200px' : '300px'} mb={4} />
            <Text color={colorModeVal === 'dark' ? 'gray.300' : 'gray.500'} fontSize={isMobile ? 'md' : 'lg'}>
                Nenhuma alocação encontrada
            </Text>
        </Flex>
    );

    const mobileCards = (
        <VStack spacing={3} align="stretch" p={2}>
            {filtered.map((request) => (
                <Box key={request.id} p={2} borderRadius="md" boxShadow="sm" bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}>
                    <Text fontWeight="bold">{request.inventory.name}</Text>
                    <Text fontSize="sm" color="gray.500">{request.requester.name} - {request.requester.email}</Text>
                    <Text fontSize="sm">Modelo: {request.inventory.model}</Text>
                    <Text fontSize="sm">Série: {request.inventory.serial_number}</Text>
                    <HStack spacing={1} mt={1} mb={1} flexWrap="wrap">
                        <Badge colorScheme={getStatusColorScheme(request.status)}>
                            {getStatusLabel(request.status)}
                        </Badge>
                        {request.is_overdue && (
                            <Badge colorScheme="red">Atrasado</Badge>
                        )}
                        {request.was_ever_overdue && !request.is_overdue && (
                            <Badge colorScheme="orange">Já atrasou</Badge>
                        )}
                    </HStack>
                    <Text fontSize="sm">Prazo de entrega: {formatDeadline(request.delivery_deadline)}</Text>
                    <Text fontSize="xs" color="gray.400">Data: {new Date(request.created_at).toLocaleDateString('pt-BR')}</Text>
                    <VStack spacing={2} mt={2} align="stretch">
                        {request.status === 'PENDING' && (
                            <HStack>
                                <Button size="sm" colorScheme="green" flex={1} onClick={() => onAllocationApprove(request.id, 'APPROVED')}>Aprovar</Button>
                                <Button size="sm" colorScheme="red" flex={1} onClick={() => onAllocationReject(request.id, 'REJECTED')}>Rejeitar</Button>
                            </HStack>
                        )}
                        {request.status === 'APPROVED' && !request.manager_delivery_confirmation && (
                            <Button size="sm" colorScheme="blue" w="full" onClick={() => onAllocationConfirmDelivery(request, true)}>Confirmar Entrega</Button>
                        )}
                        {request.status === 'RETURNED' && !request.manager_return_confirmation && (
                            <Button
                                size="sm"
                                colorScheme="purple"
                                leftIcon={<CheckCircle size={14} />}
                                onClick={() => onAllocationManagerReturnConfirmation(request)}
                            >
                                Confirmar Devolução
                            </Button>
                        )}
                        {request.status === 'DELIVERED' && (
                            <Button
                                size="sm"
                                colorScheme="purple"
                                variant="outline"
                                w="full"
                                onClick={() => onAllocationMarkAsLost(request)}
                            >
                                Marcar como perdido
                            </Button>
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
                    <Th py={2} color={thColor} bg={thBg}>Item</Th>
                    <Th py={2} color={thColor} bg={thBg}>Usuário</Th>
                    <Th py={2} color={thColor} bg={thBg}>Quantidade</Th>
                    <Th py={2} color={thColor} bg={thBg}>Status</Th>
                    <Th py={2} color={thColor} bg={thBg}>Prazo de entrega</Th>
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
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{request.inventory.name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                    {request.inventory.model} - {request.inventory.serial_number}
                                </Text>
                            </VStack>
                        </Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">{request.requester.name}</Text>
                            <Text fontSize="xs" color="gray.500">{request.requester.email}</Text>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">1</Td>
                        <Td py={1.5} px={2}>
                            <HStack spacing={1} flexWrap="wrap">
                                <Badge colorScheme={getStatusColorScheme(request.status)}>
                                    {getStatusLabel(request.status)}
                                </Badge>
                                {request.is_overdue && (
                                    <Badge colorScheme="red">Atrasado</Badge>
                                )}
                                {request.was_ever_overdue && !request.is_overdue && (
                                    <Badge colorScheme="orange">Já atrasou</Badge>
                                )}
                            </HStack>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {formatDeadline(request.delivery_deadline)}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {request.created_at ? new Date(request.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Não definida'}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {request.return_date ? new Date(request.return_date).toLocaleDateString('pt-BR') : '-'}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {request.status === 'DELIVERED' && request.manager_delivery_confirmation && request.return_date
                                ? new Date(request.return_date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                : '-'}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">{request.locale_name || '-'}</Td>
                        <Td py={1.5} px={2}>
                            <HStack spacing={1} flexWrap="wrap">
                                {request.status === 'PENDING' && (
                                    <>
                                        <Button size="xs" colorScheme="green" leftIcon={<CheckCircle size={12} />} onClick={() => onAllocationApprove(request.id, 'APPROVED')}>Aprovar</Button>
                                        <Button size="xs" colorScheme="red" leftIcon={<XCircle size={12} />} onClick={() => onAllocationReject(request.id, 'REJECTED')}>Rejeitar</Button>
                                    </>
                                )}
                                {request.status === 'APPROVED' && !request.manager_delivery_confirmation && (
                                    <Button size="xs" colorScheme="blue" leftIcon={<CheckCircle size={12} />} onClick={() => onAllocationConfirmDelivery(request, true)}>Confirmar Entrega</Button>
                                )}
                                {request.status === 'RETURNED' && !request.manager_return_confirmation && (
                                    <Button size="xs" colorScheme="purple" leftIcon={<CheckCircle size={12} />} onClick={() => onAllocationManagerReturnConfirmation(request)}>Confirmar Devolução</Button>
                                )}
                                {request.status === 'DELIVERED' && (
                                    <Button size="xs" colorScheme="purple" variant="outline" onClick={() => onAllocationMarkAsLost(request)}>Marcar como perdido</Button>
                                )}
                            </HStack>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );

    return (
        <>
            <AdminTabShell
                scrollContent={filtered.length === 0 ? emptyState : isMobile ? mobileCards : desktopTable}
            >
                <AdminTabToolbar
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    searchPlaceholder={isMobile ? 'Buscar item ou usuário...' : 'Buscar por item ou usuário...'}
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
