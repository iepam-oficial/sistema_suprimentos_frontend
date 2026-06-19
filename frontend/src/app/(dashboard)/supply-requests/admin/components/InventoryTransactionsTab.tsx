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
    Select,
    Text,
    Flex,
    VStack,
    useColorModeValue,
    useColorMode,
    Image,
    FormControl,
    FormLabel,
    useDisclosure,
} from '@chakra-ui/react';
import type { InventoryTransaction } from '@/features/inventory/types';
import { AdminTabShell } from './AdminTabShell';
import { AdminTabToolbar } from './AdminTabToolbar';
import { AdminFiltersDrawer } from './AdminFiltersDrawer';

interface InventoryTransactionsTabProps {
    inventoryTransactions: InventoryTransaction[];
    filteredInventoryTransactions: InventoryTransaction[];
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    transactionLocationFilter: string;
    onTransactionLocationFilterChange: (value: string) => void;
    transactionLocaleFilter: string;
    onTransactionLocaleFilterChange: (value: string) => void;
    onExportPDF: () => void;
    onClearFilters: () => void;
    onRefresh: () => void;
    isMobile?: boolean;
}

function getTransactionTypeLabel(type: string): string {
    switch (type) {
        case 'ALLOCATION':
            return 'Alocação';
        case 'RETURN':
            return 'Devolução';
        case 'MAINTENANCE':
            return 'Manutenção';
        case 'DISCARD':
            return 'Descarte';
        default:
            return 'Transferência';
    }
}

function getTransactionTypeColorScheme(type: string): string {
    switch (type) {
        case 'ALLOCATION':
            return 'blue';
        case 'RETURN':
            return 'green';
        case 'MAINTENANCE':
            return 'orange';
        case 'DISCARD':
            return 'red';
        default:
            return 'purple';
    }
}

function TransactionTypeBadge({ transactionType }: { transactionType: string }) {
    return (
        <Badge colorScheme={getTransactionTypeColorScheme(transactionType)}>
            {getTransactionTypeLabel(transactionType)}
        </Badge>
    );
}

export function InventoryTransactionsTab({
    inventoryTransactions,
    filteredInventoryTransactions,
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    transactionLocationFilter,
    onTransactionLocationFilterChange,
    transactionLocaleFilter,
    onTransactionLocaleFilterChange,
    onExportPDF,
    onClearFilters,
    onRefresh,
    isMobile = false,
}: InventoryTransactionsTabProps) {
    const { colorMode } = useColorMode();
    const colorModeVal = useColorModeValue('light', 'dark');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const inputBg = colorMode === 'dark' ? 'gray.700' : 'white';
    const inputBorder = colorMode === 'dark' ? 'gray.600' : 'gray.200';
    const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
    const thBg = colorMode === 'dark' ? 'gray.700' : 'gray.50';
    const thColor = colorMode === 'dark' ? 'gray.300' : 'gray.600';

    const filtersActive = Boolean(
        statusFilter || transactionLocationFilter || transactionLocaleFilter
    );

    const handleClearFilters = () => {
        onClearFilters();
        onSearchChange('');
    };

    const locationOptions = Array.from(
        new Set(
            inventoryTransactions
                .map((t) => t.destination_locale?.location.name)
                .filter(Boolean) as string[]
        )
    );

    const localeOptions = Array.from(
        new Set(
            inventoryTransactions
                .map((t) => t.destination_locale?.name)
                .filter(Boolean) as string[]
        )
    );

    const toolbarActions = (
        <>
            <Button
                size="sm"
                onClick={onExportPDF}
                colorScheme="blue"
                isDisabled={filteredInventoryTransactions.length === 0}
            >
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
                <FormLabel color={textColor} fontSize="sm">
                    Tipo de transação
                </FormLabel>
                <Select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos os tipos</option>
                    <option value="ALLOCATION">Alocação</option>
                    <option value="RETURN">Devolução</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="DISCARD">Descarte</option>
                    <option value="TRANSFER">Transferência</option>
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">
                    Filial
                </FormLabel>
                <Select
                    value={transactionLocationFilter}
                    onChange={(e) => onTransactionLocationFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todas</option>
                    {locationOptions.map((loc) => (
                        <option key={loc} value={loc}>
                            {loc}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel color={textColor} fontSize="sm">
                    Local
                </FormLabel>
                <Select
                    value={transactionLocaleFilter}
                    onChange={(e) => onTransactionLocaleFilterChange(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    size="sm"
                >
                    <option value="">Todos</option>
                    {localeOptions.map((locale) => (
                        <option key={locale} value={locale}>
                            {locale}
                        </option>
                    ))}
                </Select>
            </FormControl>
        </>
    );

    const emptyState = (
        <Flex direction="column" align="center" justify="center" py={8} h="full">
            <Image
                src="/Task-complete.svg"
                alt="Nenhuma transação encontrada"
                maxW={isMobile ? '200px' : '300px'}
                mb={4}
            />
            <Text color={colorModeVal === 'dark' ? 'gray.300' : 'gray.500'} fontSize={isMobile ? 'md' : 'lg'}>
                Nenhuma transação encontrada
            </Text>
        </Flex>
    );

    const mobileCards = (
        <VStack spacing={3} align="stretch" p={2}>
            {filteredInventoryTransactions.map((transaction) => (
                <Box
                    key={transaction.id}
                    p={3}
                    borderRadius="md"
                    boxShadow="sm"
                    bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'}
                    borderWidth="1px"
                    borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}
                >
                    <Text fontWeight="bold">{transaction.inventory.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                        {transaction.inventory.model} - {transaction.inventory.serial_number}
                    </Text>
                    <TransactionTypeBadge transactionType={transaction.transaction_type} />
                    <Badge colorScheme={transaction.movement_type === 'IN' ? 'green' : 'red'} ml={1}>
                        {transaction.movement_type === 'IN' ? 'Entrada' : 'Saída'}
                    </Badge>
                    <Text fontSize="sm">Usuário: {transaction.from_user.name}</Text>
                    <Text fontSize="xs" color="gray.400">
                        Data: {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                </Box>
            ))}
        </VStack>
    );

    const desktopTable = (
        <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} zIndex={1}>
                <Tr>
                    <Th py={2} color={thColor} bg={thBg}>
                        Item
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        Tipo
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        Movimento
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        De
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        Para
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        Destino
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        Status
                    </Th>
                    <Th py={2} color={thColor} bg={thBg}>
                        Data
                    </Th>
                </Tr>
            </Thead>
            <Tbody>
                {filteredInventoryTransactions.map((transaction) => (
                    <Tr
                        key={transaction.id}
                        _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'gray.50' }}
                    >
                        <Td py={1.5} px={2}>
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" color={textColor} fontSize="sm">
                                    {transaction.inventory.name}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {transaction.inventory.model} - {transaction.inventory.serial_number}
                                </Text>
                            </VStack>
                        </Td>
                        <Td py={1.5} px={2}>
                            <TransactionTypeBadge transactionType={transaction.transaction_type} />
                        </Td>
                        <Td py={1.5} px={2}>
                            <Badge colorScheme={transaction.movement_type === 'IN' ? 'green' : 'red'}>
                                {transaction.movement_type === 'IN' ? 'Entrada' : 'Saída'}
                            </Badge>
                        </Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">
                                {transaction.from_user.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {transaction.from_user.email}
                            </Text>
                        </Td>
                        <Td py={1.5} px={2}>
                            <Text color={textColor} fontSize="sm">
                                {transaction.to_user?.name || 'N/A'}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {transaction.to_user?.email || 'N/A'}
                            </Text>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {transaction.destination_locale
                                ? `${transaction.destination_locale.name} - ${transaction.destination_locale.location.name}`
                                : transaction.destination}
                        </Td>
                        <Td py={1.5} px={2}>
                            <Badge
                                colorScheme={
                                    transaction.status === 'ACTIVE'
                                        ? 'green'
                                        : transaction.status === 'RETURNED'
                                          ? 'blue'
                                          : 'red'
                                }
                            >
                                {transaction.status === 'ACTIVE'
                                    ? 'Ativa'
                                    : transaction.status === 'RETURNED'
                                      ? 'Devolvida'
                                      : 'Vencida'}
                            </Badge>
                        </Td>
                        <Td py={1.5} px={2} color={textColor} fontSize="sm">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
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
                    filteredInventoryTransactions.length === 0
                        ? emptyState
                        : isMobile
                          ? mobileCards
                          : desktopTable
                }
            >
                <AdminTabToolbar
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    searchPlaceholder={
                        isMobile ? 'Buscar item ou usuário...' : 'Buscar por item ou usuário...'
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
