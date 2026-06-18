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
    Spinner,
} from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DemandSupplySummaryDTO } from '@ti-assistant/contracts';
import {
    fetchDemandSupplies,
    type DemandSupplyListFilters,
} from '@/features/supply-requests/api/demandSupplyApi';
import {
    formatAggregateStatusLabel,
    formatDemandSupplyCode,
} from '@/features/supply-requests/utils/formatDemandSupply';
import { AdminTabShell } from './AdminTabShell';
import { AdminTabToolbar } from './AdminTabToolbar';
import { AdminFiltersDrawer } from './AdminFiltersDrawer';

interface DemandSupplyListTabProps {
    onOpenDrawer: (id: string) => void;
    isMobile?: boolean;
}

function getAggregateStatusColorScheme(status: string): string {
    switch (status) {
        case 'APPROVED':
            return 'green';
        case 'REJECTED':
            return 'red';
        case 'DELIVERED':
            return 'purple';
        case 'PARTIAL':
            return 'orange';
        case 'MIXED':
            return 'gray';
        case 'PENDING':
        default:
            return 'yellow';
    }
}

function formatDeadline(value: string): string {
    return new Date(value).toLocaleDateString('pt-BR');
}

export function DemandSupplyListTab({
    onOpenDrawer,
    isMobile = false,
}: DemandSupplyListTabProps) {
    const { colorMode } = useColorMode();
    const colorModeVal = useColorModeValue('light', 'dark');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [items, setItems] = useState<DemandSupplySummaryDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deliveryDeadlineStart, setDeliveryDeadlineStart] = useState('');
    const [deliveryDeadlineEnd, setDeliveryDeadlineEnd] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [localeFilter, setLocaleFilter] = useState('');

    const inputBg = colorMode === 'dark' ? 'gray.700' : 'white';
    const inputBorder = colorMode === 'dark' ? 'gray.600' : 'gray.200';
    const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
    const thBg = colorMode === 'dark' ? 'gray.700' : 'gray.50';
    const thColor = colorMode === 'dark' ? 'gray.300' : 'gray.600';

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    const filtersActive = Boolean(
        deliveryDeadlineStart ||
        deliveryDeadlineEnd ||
        locationFilter ||
        sectorFilter ||
        localeFilter
    );

    const locationOptions = useMemo(
        () =>
            [...new Map(
                items
                    .filter((item) => item.location?.id && item.location?.name)
                    .map((item) => [item.location!.id, item.location!.name])
            ).entries()].sort((a, b) => a[1].localeCompare(b[1])),
        [items]
    );

    const sectorOptions = useMemo(
        () =>
            [...new Map(
                items
                    .filter((item) => item.sector?.id && item.sector?.name)
                    .map((item) => [item.sector!.id, item.sector!.name])
            ).entries()].sort((a, b) => a[1].localeCompare(b[1])),
        [items]
    );

    const localeOptions = useMemo(
        () =>
            [...new Map(
                items
                    .filter((item) => item.locale?.id && item.locale?.name)
                    .map((item) => [item.locale!.id, item.locale!.name])
            ).entries()].sort((a, b) => a[1].localeCompare(b[1])),
        [items]
    );

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const filters: DemandSupplyListFilters = {
                limit: 100,
            };

            if (debouncedSearch) filters.search = debouncedSearch;
            if (deliveryDeadlineStart) {
                filters.delivery_deadline_from = `${deliveryDeadlineStart}T00:00:00.000Z`;
            }
            if (deliveryDeadlineEnd) {
                filters.delivery_deadline_to = `${deliveryDeadlineEnd}T23:59:59.999Z`;
            }
            if (locationFilter) filters.location_id = locationFilter;
            if (sectorFilter) filters.sector_id = sectorFilter;
            if (localeFilter) filters.locale_id = localeFilter;

            const result = await fetchDemandSupplies(token, filters);
            setItems(result.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos agrupados');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [
        debouncedSearch,
        deliveryDeadlineStart,
        deliveryDeadlineEnd,
        locationFilter,
        sectorFilter,
        localeFilter,
    ]);

    useEffect(() => {
        void loadItems();
    }, [loadItems]);

    const handleClearFilters = () => {
        setLocationFilter('');
        setSectorFilter('');
        setLocaleFilter('');
        setDeliveryDeadlineStart('');
        setDeliveryDeadlineEnd('');
        setSearch('');
    };

    const toolbarActions = (
        <>
            <Button size="sm" onClick={() => void loadItems()} colorScheme="blue">
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
                <FormLabel color={textColor} fontSize="sm">Data limite entrega (início)</FormLabel>
                <Input
                    type="date"
                    value={deliveryDeadlineStart}
                    onChange={(e) => setDeliveryDeadlineStart(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Data limite entrega (fim)</FormLabel>
                <Input
                    type="date"
                    value={deliveryDeadlineEnd}
                    onChange={(e) => setDeliveryDeadlineEnd(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Filial</FormLabel>
                <Select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todas</option>
                    {locationOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Setor</FormLabel>
                <Select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos</option>
                    {sectorOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Local de entrega</FormLabel>
                <Select
                    value={localeFilter}
                    onChange={(e) => setLocaleFilter(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos</option>
                    {localeOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
            </FormControl>
        </>
    );

    const emptyState = (
        <Flex direction="column" align="center" justify="center" py={8} h="full">
            {loading ? (
                <Spinner size="lg" />
            ) : (
                <>
                    <Image
                        src="/Task-complete.svg"
                        alt="Nenhum pedido encontrado"
                        maxW={isMobile ? '200px' : '300px'}
                        mb={4}
                    />
                    <Text color={colorModeVal === 'dark' ? 'gray.300' : 'gray.500'} fontSize={isMobile ? 'md' : 'lg'}>
                        {error ?? 'Nenhum pedido agrupado encontrado'}
                    </Text>
                </>
            )}
        </Flex>
    );

    const renderStatusBadge = (item: DemandSupplySummaryDTO) => (
        <Badge colorScheme={getAggregateStatusColorScheme(item.aggregate_status)}>
            {formatAggregateStatusLabel(item.aggregate_status)}
        </Badge>
    );

    const handleRowOpen = (id: string) => {
        onOpenDrawer(id);
    };

    const mobileCards = (
        <VStack spacing={3} align="stretch" p={2}>
            {items.map((item) => (
                <Box
                    key={item.id}
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'}
                    borderWidth="1px"
                    borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}
                    cursor="pointer"
                    onClick={() => handleRowOpen(item.id)}
                    _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'gray.50' }}
                >
                    <HStack justify="space-between" align="start">
                        <Text fontWeight="bold">{item.demand_supply_code || formatDemandSupplyCode(item.code)}</Text>
                        {renderStatusBadge(item)}
                    </HStack>
                    <Text fontSize="sm" color="gray.500">{item.user.name}</Text>
                    <Text fontSize="sm">Itens: {item.decided_items}/{item.total_items}</Text>
                    <Text fontSize="sm">Prazo: {formatDeadline(item.delivery_deadline)}</Text>
                    <Text fontSize="sm">Destino: {item.destination || '-'}</Text>
                    <Text fontSize="xs" color="gray.400">
                        {[item.location?.name, item.sector?.name, item.locale?.name].filter(Boolean).join(' · ') || '-'}
                    </Text>
                    <Button
                        size="sm"
                        mt={2}
                        colorScheme="blue"
                        leftIcon={<ExternalLink size={14} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowOpen(item.id);
                        }}
                    >
                        Abrir
                    </Button>
                </Box>
            ))}
        </VStack>
    );

    const desktopTable = (
        <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} zIndex={1}>
                <Tr>
                    <Th py={2} color={thColor} bg={thBg}>Código</Th>
                    <Th py={2} color={thColor} bg={thBg}>Requerente</Th>
                    <Th py={2} color={thColor} bg={thBg}>Itens</Th>
                    <Th py={2} color={thColor} bg={thBg}>Status</Th>
                    <Th py={2} color={thColor} bg={thBg}>Prazo</Th>
                    <Th py={2} color={thColor} bg={thBg}>Destino</Th>
                    <Th py={2} color={thColor} bg={thBg}>Filial</Th>
                    <Th py={2} color={thColor} bg={thBg}>Setor</Th>
                    <Th py={2} color={thColor} bg={thBg}>Local</Th>
                    <Th py={2} color={thColor} bg={thBg}>Ações</Th>
                </Tr>
            </Thead>
            <Tbody>
                {items.map((item) => (
                    <Tr
                        key={item.id}
                        cursor="pointer"
                        onClick={() => handleRowOpen(item.id)}
                        _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'gray.50' }}
                    >
                        <Td py={1.5} px={2} color={textColor} fontSize="sm" fontWeight="medium">
                            {item.demand_supply_code || formatDemandSupplyCode(item.code)}
                        </Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">{item.user.name}</Text>
                            <Text fontSize="xs" color="gray.500">{item.user.email}</Text>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {item.decided_items}/{item.total_items}
                        </Td>
                        <Td py={1.5} px={2}>{renderStatusBadge(item)}</Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {formatDeadline(item.delivery_deadline)}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {item.destination || '-'}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {item.location?.name || '-'}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {item.sector?.name || '-'}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {item.locale?.name || '-'}
                        </Td>
                        <Td py={1.5} px={2}>
                            <Button
                                size="xs"
                                colorScheme="blue"
                                leftIcon={<ExternalLink size={12} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowOpen(item.id);
                                }}
                            >
                                Abrir
                            </Button>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );

    const scrollContent =
        loading && items.length === 0
            ? emptyState
            : !loading && items.length === 0
              ? emptyState
              : isMobile
                ? mobileCards
                : desktopTable;

    return (
        <>
            <AdminTabShell scrollContent={scrollContent}>
                <AdminTabToolbar
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder={
                        isMobile
                            ? 'Buscar pedido ou requerente...'
                            : 'Buscar por código, destino ou requerente...'
                    }
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
