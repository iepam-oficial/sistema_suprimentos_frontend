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
import type { InventoryTransaction } from '@/features/inventory/types';

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
    const colorMode = useColorModeValue('light', 'dark');

    if (isMobile) {
        return (
            <Box bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'} p={2} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} backdropFilter="blur(12px)">
                <InputGroup size="md" mb={3} mt="5vh">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar item ou usuário..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    />
                </InputGroup>
                <Select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} size="sm" mb={3}>
                    <option value="">Todos os status</option>
                    <option value="ALLOCATION">Alocação</option>
                    <option value="RETURN">Devolução</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="DISCARD">Descarte</option>
                    <option value="TRANSFER">Transferência</option>
                </Select>
                <Button w="full" size="sm" colorScheme="blue" mb={2} onClick={onExportPDF} isDisabled={filteredInventoryTransactions.length === 0}>Exportar PDF</Button>
                <Button w="full" size="sm" colorScheme="blue" mb={2} leftIcon={<RotateCcw size={16} />} onClick={onRefresh}>Atualizar</Button>
                <Button w="full" size="sm" colorScheme="gray" variant="outline" mb={4} onClick={onClearFilters}>Limpar Filtros</Button>
                {filteredInventoryTransactions.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" py={8}>
                        <Image src="/Task-complete.svg" alt="Nenhuma transação encontrada" maxW="200px" mb={4} />
                        <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="md">Nenhuma transação encontrada</Text>
                    </Flex>
                ) : (
                    <VStack spacing={3} align="stretch">
                        {filteredInventoryTransactions.map((transaction) => (
                            <Box key={transaction.id} p={3} borderRadius="md" boxShadow="sm" bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}>
                                <Text fontWeight="bold">{transaction.inventory.name}</Text>
                                <Text fontSize="sm" color="gray.500">{transaction.inventory.model} - {transaction.inventory.serial_number}</Text>
                                <Badge colorScheme={transaction.transaction_type === 'ALLOCATION' ? 'blue' : transaction.transaction_type === 'RETURN' ? 'green' : transaction.transaction_type === 'MAINTENANCE' ? 'orange' : transaction.transaction_type === 'DISCARD' ? 'red' : 'purple'} mt={1} mb={1}>
                                    {transaction.transaction_type === 'ALLOCATION' ? 'Alocação' : transaction.transaction_type === 'RETURN' ? 'Devolução' : transaction.transaction_type === 'MAINTENANCE' ? 'Manutenção' : transaction.transaction_type === 'DISCARD' ? 'Descarte' : 'Transferência'}
                                </Badge>
                                <Badge colorScheme={transaction.movement_type === 'IN' ? 'green' : 'red'}>{transaction.movement_type === 'IN' ? 'Entrada' : 'Saída'}</Badge>
                                <Text fontSize="sm">Usuário: {transaction.from_user.name}</Text>
                                <Text fontSize="xs" color="gray.400">Data: {new Date(transaction.created_at).toLocaleDateString('pt-BR')}</Text>
                            </Box>
                        ))}
                    </VStack>
                )}
            </Box>
        );
    }

    return (
        <Box
            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            backdropFilter="blur(12px)"
        >
            <Flex gap={4} mb={4} justify="space-between">
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar por item ou usuário..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        _hover={{
                            borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                        }}
                        _focus={{
                            borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
                            boxShadow: 'none',
                        }}
                    />
                </InputGroup>
                <Select
                    placeholder="Filtrar por status"
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    maxW="200px"
                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                    backdropFilter="blur(12px)"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    _hover={{
                        borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    }}
                    _focus={{
                        borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500',
                        boxShadow: 'none',
                    }}
                >
                    <option value="">Todos</option>
                    <option value="ALLOCATION">Alocação</option>
                    <option value="RETURN">Devolução</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="DISCARD">Descarte</option>
                    <option value="TRANSFER">Transferência</option>
                </Select>

                <Button
                    size="sm"
                    onClick={onExportPDF}
                    colorScheme="blue"
                    leftIcon={<FileText size={16} />}
                    isDisabled={filteredInventoryTransactions.length === 0}
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

            {filteredInventoryTransactions.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={8}>
                    <Image
                        src="/Task-complete.svg"
                        alt="Nenhuma transação encontrada"
                        maxW="300px"
                        mb={4}
                    />
                    <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="lg">
                        Nenhuma transação encontrada
                    </Text>
                </Flex>
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Item</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Tipo</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Movimento</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>De</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Para</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Destino</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Status</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Data</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredInventoryTransactions.map((transaction) => (
                                <Tr
                                    key={transaction.id}
                                    transition="all 0.3s ease"
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                                        transform: 'translateY(-1px)',
                                    }}
                                >
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="bold">{transaction.inventory.name}</Text>
                                            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                                {transaction.inventory.model} - {transaction.inventory.serial_number}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Badge
                                            colorScheme={
                                                transaction.transaction_type === 'ALLOCATION'
                                                    ? 'blue'
                                                    : transaction.transaction_type === 'RETURN'
                                                        ? 'green'
                                                        : transaction.transaction_type === 'MAINTENANCE'
                                                            ? 'orange'
                                                            : transaction.transaction_type === 'DISCARD'
                                                                ? 'red'
                                                                : 'purple'
                                            }
                                        >
                                            {transaction.transaction_type === 'ALLOCATION'
                                                ? 'Alocação'
                                                : transaction.transaction_type === 'RETURN'
                                                    ? 'Devolução'
                                                    : transaction.transaction_type === 'MAINTENANCE'
                                                        ? 'Manutenção'
                                                        : transaction.transaction_type === 'DISCARD'
                                                            ? 'Descarte'
                                                            : 'Transferência'}
                                        </Badge>
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Badge
                                            colorScheme={transaction.movement_type === 'IN' ? 'green' : 'red'}
                                        >
                                            {transaction.movement_type === 'IN' ? 'Entrada' : 'Saída'}
                                        </Badge>
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Text color={colorMode === 'dark' ? 'white' : 'gray.800'}>{transaction.from_user.name}</Text>
                                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                            {transaction.from_user.email}
                                        </Text>
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Text color={colorMode === 'dark' ? 'white' : 'gray.800'}>{transaction.to_user?.name || 'N/A'}</Text>
                                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                            {transaction.to_user?.email || 'N/A'}
                                        </Text>
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {transaction.destination_locale ? 
                                            `${transaction.destination_locale.name} - ${transaction.destination_locale.location.name}` : 
                                            transaction.destination}
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
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
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
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