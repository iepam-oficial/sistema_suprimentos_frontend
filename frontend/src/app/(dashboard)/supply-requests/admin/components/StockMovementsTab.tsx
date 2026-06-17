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
    InputGroup,
    InputLeftElement,
    Input,
    Select,
    Text,
    Flex,
    VStack,
    useColorModeValue,
    Image,
    Button,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FileText, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { StockMovement } from '@/features/catalog/types';
import {
    formatMovementTypeLabel,
    formatMovementUnitCost,
    formatMovementTotalCost,
    getMovementPolo,
    formatBatchSupplier,
} from '../utils/stockMovementFormatters';

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

function RequestLink({ supplyRequestId }: { supplyRequestId: string | null }) {
    if (!supplyRequestId) {
        return <>—</>;
    }

    return (
        <Link href={`/supply-requests/${supplyRequestId}`}>
            <Text
                as="span"
                color="blue.400"
                fontSize="sm"
                wordBreak="break-all"
                _hover={{ textDecoration: 'underline' }}
            >
                {supplyRequestId}
            </Text>
        </Link>
    );
}

const inputStyles = (colorMode: string) => ({
    bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(12px)',
    borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    _hover: {
        borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    _focus: {
        borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
        boxShadow: 'none',
    },
});

function MovementFilters({
    colorMode,
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
    isMobile,
}: Pick<
    StockMovementsTabProps,
    | 'movementSearch'
    | 'onMovementSearchChange'
    | 'movementTypeFilter'
    | 'onMovementTypeFilterChange'
    | 'movementPoloFilter'
    | 'onMovementPoloFilterChange'
    | 'movementSectorFilter'
    | 'onMovementSectorFilterChange'
    | 'movementDateFrom'
    | 'onMovementDateFromChange'
    | 'movementDateTo'
    | 'onMovementDateToChange'
    | 'poloOptions'
    | 'sectorOptions'
> & { colorMode: string; isMobile: boolean }) {
    const styles = inputStyles(colorMode);

    if (isMobile) {
        return (
            <>
                <InputGroup size="md" mb={3} mt="5vh">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar suprimento ou usuário..."
                        value={movementSearch}
                        onChange={(e) => onMovementSearchChange(e.target.value)}
                        {...styles}
                    />
                </InputGroup>
                <Select
                    value={movementTypeFilter}
                    onChange={(e) => onMovementTypeFilterChange(e.target.value)}
                    size="sm"
                    mb={3}
                >
                    <option value="">Todos os tipos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                    <option value="DEVOLUCAO">Devolução</option>
                    <option value="PERDA">Perda</option>
                </Select>
                <Select
                    value={movementPoloFilter}
                    onChange={(e) => onMovementPoloFilterChange(e.target.value)}
                    size="sm"
                    mb={3}
                >
                    <option value="">Todos os polos</option>
                    {poloOptions.map((polo) => (
                        <option key={polo} value={polo}>
                            {polo}
                        </option>
                    ))}
                </Select>
                <Select
                    value={movementSectorFilter}
                    onChange={(e) => onMovementSectorFilterChange(e.target.value)}
                    size="sm"
                    mb={3}
                >
                    <option value="">Todos os setores</option>
                    {sectorOptions.map((sector) => (
                        <option key={sector} value={sector}>
                            {sector}
                        </option>
                    ))}
                </Select>
                <Input
                    type="date"
                    value={movementDateFrom}
                    onChange={(e) => onMovementDateFromChange(e.target.value)}
                    size="sm"
                    mb={3}
                    {...styles}
                />
                <Input
                    type="date"
                    value={movementDateTo}
                    onChange={(e) => onMovementDateToChange(e.target.value)}
                    size="sm"
                    mb={3}
                    {...styles}
                />
            </>
        );
    }

    return (
        <Flex gap={4} mb={4} flexWrap="wrap" align="flex-end">
            <InputGroup flex="1" minW="200px">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                </InputLeftElement>
                <Input
                    placeholder="Buscar por item ou usuário..."
                    value={movementSearch}
                    onChange={(e) => onMovementSearchChange(e.target.value)}
                    {...styles}
                />
            </InputGroup>
            <Select
                placeholder="Filtrar por tipo"
                value={movementTypeFilter}
                onChange={(e) => onMovementTypeFilterChange(e.target.value)}
                maxW="180px"
                {...styles}
            >
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
                <option value="DEVOLUCAO">Devolução</option>
                <option value="PERDA">Perda</option>
            </Select>
            <Select
                placeholder="Filtrar por polo"
                value={movementPoloFilter}
                onChange={(e) => onMovementPoloFilterChange(e.target.value)}
                maxW="180px"
                {...styles}
            >
                <option value="">Todos</option>
                {poloOptions.map((polo) => (
                    <option key={polo} value={polo}>
                        {polo}
                    </option>
                ))}
            </Select>
            <Select
                placeholder="Filtrar por setor"
                value={movementSectorFilter}
                onChange={(e) => onMovementSectorFilterChange(e.target.value)}
                maxW="180px"
                {...styles}
            >
                <option value="">Todos</option>
                {sectorOptions.map((sector) => (
                    <option key={sector} value={sector}>
                        {sector}
                    </option>
                ))}
            </Select>
            <Input
                type="date"
                value={movementDateFrom}
                onChange={(e) => onMovementDateFromChange(e.target.value)}
                maxW="160px"
                {...styles}
            />
            <Input
                type="date"
                value={movementDateTo}
                onChange={(e) => onMovementDateToChange(e.target.value)}
                maxW="160px"
                {...styles}
            />
        </Flex>
    );
}

function ActionButtons({
    colorMode,
    filteredStockMovements,
    onExportPDF,
    onRefresh,
    onClearFilters,
    isMobile,
}: {
    colorMode: string;
    filteredStockMovements: StockMovement[];
    onExportPDF: () => void;
    onRefresh: () => void;
    onClearFilters: () => void;
    isMobile: boolean;
}) {
    const isEmpty = filteredStockMovements.length === 0;

    if (isMobile) {
        return (
            <>
                <Button
                    w="full"
                    size="sm"
                    colorScheme="blue"
                    mb={2}
                    leftIcon={<FileText size={16} />}
                    onClick={onExportPDF}
                    isDisabled={isEmpty}
                >
                    Exportar PDF
                </Button>
                <Button
                    w="full"
                    size="sm"
                    colorScheme="blue"
                    mb={2}
                    leftIcon={<RotateCcw size={16} />}
                    onClick={onRefresh}
                >
                    Atualizar
                </Button>
                <Button
                    w="full"
                    size="sm"
                    colorScheme="gray"
                    variant="outline"
                    mb={4}
                    onClick={onClearFilters}
                >
                    Limpar Filtros
                </Button>
            </>
        );
    }

    return (
        <Flex gap={4} mb={4} flexWrap="wrap">
            <Button
                size="sm"
                onClick={onExportPDF}
                colorScheme="blue"
                leftIcon={<FileText size={16} />}
                isDisabled={isEmpty}
                minW="140px"
                h="36px"
                fontSize="sm"
                fontWeight="medium"
                _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                }}
                transition="all 0.2s ease"
            >
                Exportar PDF
            </Button>
            <Button
                size="sm"
                onClick={onRefresh}
                colorScheme="blue"
                leftIcon={<RotateCcw size={16} />}
                minW="140px"
                h="36px"
                fontSize="sm"
                fontWeight="medium"
                _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                }}
                transition="all 0.2s ease"
            >
                Atualizar
            </Button>
            <Button
                size="sm"
                onClick={onClearFilters}
                colorScheme="gray"
                variant="outline"
                leftIcon={<RotateCcw size={16} />}
                minW="140px"
                h="36px"
                fontSize="sm"
                fontWeight="medium"
                _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                }}
                transition="all 0.2s ease"
            >
                Limpar Filtros
            </Button>
        </Flex>
    );
}

function EmptyState({ colorMode, isMobile }: { colorMode: string; isMobile: boolean }) {
    return (
        <Flex direction="column" align="center" justify="center" py={8}>
            <Image
                src="/Task-complete.svg"
                alt="Nenhuma movimentação encontrada"
                maxW={isMobile ? '200px' : '300px'}
                mb={4}
            />
            <Text
                color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}
                fontSize={isMobile ? 'md' : 'lg'}
            >
                Nenhuma movimentação encontrada
            </Text>
        </Flex>
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
            <Text fontSize="sm" mt={1}>
                Requisição: <RequestLink supplyRequestId={movement.supply_request_id} />
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
    const colorMode = useColorModeValue('light', 'dark');

    const containerProps = {
        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        p: isMobile ? 2 : 6,
        borderRadius: 'lg',
        boxShadow: 'sm',
        borderWidth: '1px',
        borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)',
    };

    const thProps = {
        color: colorMode === 'dark' ? 'gray.300' : 'gray.600',
        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    };

    const tdProps = {
        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    };

    if (isMobile) {
        return (
            <Box {...containerProps}>
                <MovementFilters
                    colorMode={colorMode}
                    movementSearch={movementSearch}
                    onMovementSearchChange={onMovementSearchChange}
                    movementTypeFilter={movementTypeFilter}
                    onMovementTypeFilterChange={onMovementTypeFilterChange}
                    movementPoloFilter={movementPoloFilter}
                    onMovementPoloFilterChange={onMovementPoloFilterChange}
                    movementSectorFilter={movementSectorFilter}
                    onMovementSectorFilterChange={onMovementSectorFilterChange}
                    movementDateFrom={movementDateFrom}
                    onMovementDateFromChange={onMovementDateFromChange}
                    movementDateTo={movementDateTo}
                    onMovementDateToChange={onMovementDateToChange}
                    poloOptions={poloOptions}
                    sectorOptions={sectorOptions}
                    isMobile
                />
                <ActionButtons
                    colorMode={colorMode}
                    filteredStockMovements={filteredStockMovements}
                    onExportPDF={onExportPDF}
                    onRefresh={onRefresh}
                    onClearFilters={onClearFilters}
                    isMobile
                />
                {filteredStockMovements.length === 0 ? (
                    <EmptyState colorMode={colorMode} isMobile />
                ) : (
                    <VStack spacing={3} align="stretch">
                        {filteredStockMovements.map((movement) => (
                            <MobileMovementCard
                                key={movement.id}
                                movement={movement}
                                colorMode={colorMode}
                            />
                        ))}
                    </VStack>
                )}
            </Box>
        );
    }

    return (
        <Box {...containerProps}>
            <MovementFilters
                colorMode={colorMode}
                movementSearch={movementSearch}
                onMovementSearchChange={onMovementSearchChange}
                movementTypeFilter={movementTypeFilter}
                onMovementTypeFilterChange={onMovementTypeFilterChange}
                movementPoloFilter={movementPoloFilter}
                onMovementPoloFilterChange={onMovementPoloFilterChange}
                movementSectorFilter={movementSectorFilter}
                onMovementSectorFilterChange={onMovementSectorFilterChange}
                movementDateFrom={movementDateFrom}
                onMovementDateFromChange={onMovementDateFromChange}
                movementDateTo={movementDateTo}
                onMovementDateToChange={onMovementDateToChange}
                poloOptions={poloOptions}
                sectorOptions={sectorOptions}
                isMobile={false}
            />
            <ActionButtons
                colorMode={colorMode}
                filteredStockMovements={filteredStockMovements}
                onExportPDF={onExportPDF}
                onRefresh={onRefresh}
                onClearFilters={onClearFilters}
                isMobile={false}
            />

            {filteredStockMovements.length === 0 ? (
                <EmptyState colorMode={colorMode} isMobile={false} />
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th {...thProps}>Suprimento</Th>
                                <Th {...thProps}>Tipo</Th>
                                <Th {...thProps}>De</Th>
                                <Th {...thProps}>Para</Th>
                                <Th {...thProps}>Quantidade</Th>
                                <Th {...thProps}>Custo Unit.</Th>
                                <Th {...thProps}>Custo Total</Th>
                                <Th {...thProps}>Lote/Fornecedor</Th>
                                <Th {...thProps}>Requisição</Th>
                                <Th {...thProps}>Setor</Th>
                                <Th {...thProps}>Polo</Th>
                                <Th {...thProps}>Data</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredStockMovements.map((movement) => (
                                <Tr
                                    key={movement.id}
                                    transition="all 0.3s ease"
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                                        transform: 'translateY(-1px)',
                                    }}
                                >
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        <Text fontWeight="bold">{movement.supply?.name ?? 'N/A'}</Text>
                                    </Td>
                                    <Td {...tdProps}>
                                        <MovementTypeBadge movementType={movement.movement_type} />
                                    </Td>
                                    <Td {...tdProps}>
                                        <Text color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                                            {movement.from_user?.name ?? 'N/A'}
                                        </Text>
                                        {movement.from_user?.email && (
                                            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                                {movement.from_user.email}
                                            </Text>
                                        )}
                                    </Td>
                                    <Td {...tdProps}>
                                        <Text color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                                            {movement.to_user?.name ?? 'N/A'}
                                        </Text>
                                        {movement.to_user?.email && (
                                            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                                {movement.to_user.email}
                                            </Text>
                                        )}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {movement.quantity} {movement.supply?.unit?.symbol ?? ''}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {formatMovementUnitCost(movement.unit_cost)}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {formatMovementTotalCost(movement.total_cost)}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {formatBatchSupplier(movement.batch)}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        <RequestLink supplyRequestId={movement.supply_request_id} />
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {movement.sector ? (
                                            <VStack align="start" spacing={1}>
                                                <Text fontWeight="bold">{movement.sector.name}</Text>
                                                <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                                    {movement.sector.location?.name ?? 'N/A'}
                                                </Text>
                                            </VStack>
                                        ) : (
                                            <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} fontSize="sm">
                                                N/A
                                            </Text>
                                        )}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {getMovementPolo(movement)}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} {...tdProps}>
                                        {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}
        </Box>
    );
}
