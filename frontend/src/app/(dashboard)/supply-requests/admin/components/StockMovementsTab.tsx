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
    FormControl,
    FormLabel,
    useColorModeValue,
    useColorMode,
    useDisclosure,
    Image,
} from '@chakra-ui/react';
import { FileText, RotateCcw } from 'lucide-react';
import type { StockMovement } from '@/features/catalog/types';
import {
    formatMovementTypeLabel,
    formatMovementUnitCost,
    formatMovementTotalCost,
    getMovementPolo,
    formatBatchSupplier,
} from '../utils/stockMovementFormatters';
import { AdminTabShell } from './AdminTabShell';
import { AdminTabToolbar } from './AdminTabToolbar';
import { AdminFiltersDrawer } from './AdminFiltersDrawer';

interface StockMovementsTabProps {
    stockMovements: StockMovement[];
    filteredStockMovements: StockMovement[];
    movementSearch: string;
    onMovementSearchChange: (value: string) => void;
    movementTypeFilter: string;
    onMovementTypeFilterChange: (value: string) => void;
    movementPoloFilter: string;
    onMovementPoloFilterChange: (value: string) => void;
    movementSectorFilter: string;
    onMovementSectorFilterChange: (value: string) => void;
    movementDateFrom: string;
    onMovementDateFromChange: (value: string) => void;
    movementDateTo: string;
    onMovementDateToChange: (value: string) => void;
    poloOptions: string[];
    sectorOptions: string[];
    onExportPDF: () => void;
    onClearFilters: () => void;
    onRefresh: () => void;
    isMobile?: boolean;
}

function getMovementTypeColorScheme(movementType: string): string {
    switch (movementType) {
        case 'ENTRADA':
            return 'blue';
        case 'SAIDA':
            return 'red';
        case 'DEVOLUCAO':
            return 'green';
        case 'PERDA':
            return 'orange';
        default:
            return 'gray';
    }
}

function MovementTypeBadge({ movementType }: { movementType: string }) {
    return (
        <Badge colorScheme={getMovementTypeColorScheme(movementType)}>
            {formatMovementTypeLabel(movementType)}
        </Badge>
    );
}

function MobileMovementCard({
    movement,
    colorMode,
}: {
    movement: StockMovement;
    colorMode: string;
}) {
    return (
        <Box
            p={3}
            borderRadius="md"
            boxShadow="sm"
            bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'}
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}
        >
            <Text fontWeight="bold" wordBreak="break-word">
                {movement.supply?.name ?? 'N/A'}
            </Text>
            <MovementTypeBadge movementType={movement.movement_type} />
            <Text fontSize="sm" mt={2}>
                Quantidade: {movement.quantity} {movement.supply?.unit?.symbol ?? ''}
            </Text>
            <Text fontSize="sm">
                Custo total: {formatMovementTotalCost(movement.total_cost)}
            </Text>
            <Text fontSize="sm">Polo: {getMovementPolo(movement)}</Text>
            <Text fontSize="sm" wordBreak="break-word">
                Lote/Fornecedor: {formatBatchSupplier(movement.batch)}
            </Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
                Data: {new Date(movement.created_at).toLocaleDateString('pt-BR')}
            </Text>
        </Box>
    );
}

export function StockMovementsTab({
    stockMovements: _stockMovements,
    filteredStockMovements,
    movementSearch,
    onMovementSearchChange,
    movementTypeFilter,
    onMovementTypeFilterChange,
    movementPoloFilter,
    onMovementPoloFilterChange,
    movementSectorFilter,
    onMovementSectorFilterChange,
    movementDateFrom,
    onMovementDateFromChange,
    movementDateTo,
    onMovementDateToChange,
    poloOptions,
    sectorOptions,
    onExportPDF,
    onClearFilters,
    onRefresh,
    isMobile = false,
}: StockMovementsTabProps) {
    const { colorMode } = useColorMode();
    const colorModeVal = useColorModeValue('light', 'dark');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const inputBg = colorMode === 'dark' ? 'gray.700' : 'white';
    const inputBorder = colorMode === 'dark' ? 'gray.600' : 'gray.200';
    const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
    const thBg = colorMode === 'dark' ? 'gray.700' : 'gray.50';
    const thColor = colorMode === 'dark' ? 'gray.300' : 'gray.600';

    const filtersActive = Boolean(
        movementTypeFilter ||
        movementPoloFilter ||
        movementSectorFilter ||
        movementDateFrom ||
        movementDateTo
    );

    const handleClearFilters = () => {
        onClearFilters();
    };

    const toolbarActions = (
        <>
            <Button
                size="sm"
                onClick={onExportPDF}
                colorScheme="blue"
                leftIcon={<FileText size={16} />}
                isDisabled={filteredStockMovements.length === 0}
            >
                Exportar PDF
            </Button>
            <Button
                size="sm"
                onClick={onRefresh}
                colorScheme="blue"
                leftIcon={<RotateCcw size={16} />}
            >
                Atualizar
            </Button>
            <Button
                size="sm"
                onClick={handleClearFilters}
                colorScheme="gray"
                variant="outline"
            >
                Limpar Filtros
            </Button>
        </>
    );

    const filterFields = (
        <>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Tipo</FormLabel>
                <Select
                    value={movementTypeFilter}
                    onChange={(e) => onMovementTypeFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos os tipos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                    <option value="DEVOLUCAO">Devolução</option>
                    <option value="PERDA">Perda</option>
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Polo</FormLabel>
                <Select
                    value={movementPoloFilter}
                    onChange={(e) => onMovementPoloFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos os polos</option>
                    {poloOptions.map((polo) => (
                        <option key={polo} value={polo}>
                            {polo}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Setor</FormLabel>
                <Select
                    value={movementSectorFilter}
                    onChange={(e) => onMovementSectorFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos os setores</option>
                    {sectorOptions.map((sector) => (
                        <option key={sector} value={sector}>
                            {sector}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Período de</FormLabel>
                <Input
                    type="date"
                    value={movementDateFrom}
                    onChange={(e) => onMovementDateFromChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                />
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">Período até</FormLabel>
                <Input
                    type="date"
                    value={movementDateTo}
                    onChange={(e) => onMovementDateToChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                />
            </FormControl>
        </>
    );

    const emptyState = (
        <Flex direction="column" align="center" justify="center" py={8} h="full">
            <Image
                src="/Task-complete.svg"
                alt="Nenhuma movimentação encontrada"
                maxW={isMobile ? '200px' : '300px'}
                mb={4}
            />
            <Text
                color={colorModeVal === 'dark' ? 'gray.300' : 'gray.500'}
                fontSize={isMobile ? 'md' : 'lg'}
            >
                Nenhuma movimentação encontrada
            </Text>
        </Flex>
    );

    const mobileCards = (
        <VStack spacing={3} align="stretch" p={2}>
            {filteredStockMovements.map((movement) => (
                <MobileMovementCard
                    key={movement.id}
                    movement={movement}
                    colorMode={colorMode}
                />
            ))}
        </VStack>
    );

    const desktopTable = (
        <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} zIndex={1}>
                <Tr>
                    <Th py={2} color={thColor} bg={thBg}>Suprimento</Th>
                    <Th py={2} color={thColor} bg={thBg}>Tipo</Th>
                    <Th py={2} color={thColor} bg={thBg}>De</Th>
                    <Th py={2} color={thColor} bg={thBg}>Para</Th>
                    <Th py={2} color={thColor} bg={thBg}>Quantidade</Th>
                    <Th py={2} color={thColor} bg={thBg}>Custo Unit.</Th>
                    <Th py={2} color={thColor} bg={thBg}>Custo Total</Th>
                    <Th py={2} color={thColor} bg={thBg}>Lote/Fornecedor</Th>
                    <Th py={2} color={thColor} bg={thBg}>Setor</Th>
                    <Th py={2} color={thColor} bg={thBg}>Polo</Th>
                    <Th py={2} color={thColor} bg={thBg}>Data</Th>
                </Tr>
            </Thead>
            <Tbody>
                {filteredStockMovements.map((movement) => (
                    <Tr
                        key={movement.id}
                        _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'gray.50' }}
                    >
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            <Text fontWeight="bold">{movement.supply?.name ?? 'N/A'}</Text>
                        </Td>
                        <Td py={1.5} px={2}>
                            <MovementTypeBadge movementType={movement.movement_type} />
                        </Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">
                                {movement.from_user?.name ?? 'N/A'}
                            </Text>
                            {movement.from_user?.email && (
                                <Text fontSize="xs" color="gray.500">
                                    {movement.from_user.email}
                                </Text>
                            )}
                        </Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">
                                {movement.to_user?.name ?? 'N/A'}
                            </Text>
                            {movement.to_user?.email && (
                                <Text fontSize="xs" color="gray.500">
                                    {movement.to_user.email}
                                </Text>
                            )}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {movement.quantity} {movement.supply?.unit?.symbol ?? ''}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {formatMovementUnitCost(movement.unit_cost)}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {formatMovementTotalCost(movement.total_cost)}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {formatBatchSupplier(movement.batch)}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {movement.sector ? (
                                <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold" fontSize="sm">{movement.sector.name}</Text>
                                    <Text fontSize="xs" color="gray.500">
                                        {movement.sector.location?.name ?? 'N/A'}
                                    </Text>
                                </VStack>
                            ) : (
                                <Text color="gray.500" fontSize="sm">N/A</Text>
                            )}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {getMovementPolo(movement)}
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );

    return (
        <>
            <AdminTabShell
                scrollContent={
                    filteredStockMovements.length === 0
                        ? emptyState
                        : isMobile
                          ? mobileCards
                          : desktopTable
                }
            >
                <AdminTabToolbar
                    searchValue={movementSearch}
                    onSearchChange={onMovementSearchChange}
                    searchPlaceholder={
                        isMobile
                            ? 'Buscar suprimento ou usuário...'
                            : 'Buscar por item ou usuário...'
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
