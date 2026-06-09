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
    InputGroup,
    InputLeftElement,
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
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { SupplyRequest } from '../../types';

interface SupplyRequestsTabProps {
    requests: SupplyRequest[];
    filteredRequests: SupplyRequest[];
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    onApprove: (id: string, status: 'APPROVED' | 'REJECTED') => void;
    onReject: (id: string, status: 'APPROVED' | 'REJECTED') => void;
    onConfirmDelivery: (request: any, confirmation: boolean) => void;
    onExportPDF: () => void;
    onClearFilters: () => void;
    onRefresh: () => void;
    isMobile?: boolean;
}

export function SupplyRequestsTab({
    requests,
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
    const colorMode = useColorModeValue('light', 'dark');
    const [deliveryDeadlineStart, setDeliveryDeadlineStart] = useState('');
    const [deliveryDeadlineEnd, setDeliveryDeadlineEnd] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [localeFilter, setLocaleFilter] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const filtered = filteredRequests
        .filter(r => {
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
        .filter(r => !locationFilter || (r.location?.name && r.location.name === locationFilter))
        .filter(r => !sectorFilter || (r.sector?.name && r.sector.name === sectorFilter))
        .filter(r => !localeFilter || (r.locale?.name && r.locale.name === localeFilter));

    if (isMobile) {
        return (
            <Box bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'} p={1} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} backdropFilter="blur(12px)">
                <InputGroup size="md" mb={3} mt="5vh">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar suprimentos ou usuário..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    />
                </InputGroup>
                <HStack spacing={2} mb={3}>
                    <Button flex={1} size="sm" colorScheme="gray" onClick={onOpen}>Filtros</Button>
                    <Button size="sm" colorScheme="blue" leftIcon={<RotateCcw size={16} />} onClick={onRefresh}>
                        Atualizar
                    </Button>
                </HStack>
                <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
                    <DrawerOverlay />
                    <DrawerContent bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)'} backdropFilter="blur(12px)" p={2}>
                        <DrawerHeader borderBottomWidth="1px" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Filtros Avançados</DrawerHeader>
                        <DrawerBody>
                            <VStack spacing={4} align="stretch">
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Status</FormLabel>
                                    <Select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} size="sm">
                                        <option value="">Todos os status</option>
                                        <option value="PENDING">Pendente</option>
                                        <option value="APPROVED">Aprovado</option>
                                        <option value="REJECTED">Rejeitado</option>
                                        <option value="DELIVERED">Entregue</option>
                                        <option value="CANCELLED">Cancelado</option>
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Filial</FormLabel>
                                    <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} size="sm">
                                        <option value="">Todas</option>
                                        {Array.from(new Set(filteredRequests.map(r => r.location?.name).filter(Boolean))).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Setor</FormLabel>
                                    <Select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} size="sm">
                                        <option value="">Todos</option>
                                        {Array.from(new Set(filteredRequests.map(r => r.sector?.name).filter(Boolean))).map(sector => (
                                            <option key={sector} value={sector}>{sector}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Local de Entrega</FormLabel>
                                    <Select value={localeFilter} onChange={(e) => setLocaleFilter(e.target.value)} size="sm">
                                        <option value="">Todos</option>
                                        {Array.from(new Set(filteredRequests.map(r => r.locale?.name).filter(Boolean))).map(locale => (
                                            <option key={locale} value={locale}>{locale}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Data Limite de Entrega (início)</FormLabel>
                                    <Input type="date" value={deliveryDeadlineStart} onChange={(e) => setDeliveryDeadlineStart(e.target.value)} size="sm" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Data Limite de Entrega (fim)</FormLabel>
                                    <Input type="date" value={deliveryDeadlineEnd} onChange={(e) => setDeliveryDeadlineEnd(e.target.value)} size="sm" />
                                </FormControl>
                                <Button w="full" size="md" colorScheme="gray" variant="outline" mt={4} onClick={() => {
                                    onClearFilters();
                                    setLocationFilter('');
                                    setSectorFilter('');
                                    setLocaleFilter('');
                                    setDeliveryDeadlineStart('');
                                    setDeliveryDeadlineEnd('');
                                    onClose();
                                }}>Limpar Filtros</Button>
                            </VStack>
                        </DrawerBody>
                        <DrawerFooter borderTopWidth="1px">
                            <Button variant="outline" mr={3} onClick={onClose}>Fechar</Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
                {filtered.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" py={8}>
                        <Image src="/Task-complete.svg" alt="Nenhuma requisição encontrada" maxW="200px" mb={4} />
                        <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="md">Nenhuma requisição encontrada</Text>
                    </Flex>
                ) : (
                    <VStack spacing={3} align="stretch">
                        {filtered.map((request) => (
                            <Box key={request.id} p={1} borderRadius="md" boxShadow="sm" bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}>
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
                )}
            </Box>
        );
    }

    return (
        <>
            <Flex gap={4} mb={4} flexWrap="wrap" align="end">
                <FormControl maxW="320px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Buscar por suprimento ou usuário</FormLabel>
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                        </InputLeftElement>
                        <Input
                            placeholder="Digite para buscar..."
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
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Data Limite de Entrega (início)</FormLabel>
                    <Input
                        type="date"
                        value={deliveryDeadlineStart}
                        onChange={(e) => setDeliveryDeadlineStart(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    />
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Data Limite de Entrega (fim)</FormLabel>
                    <Input
                        type="date"
                        value={deliveryDeadlineEnd}
                        onChange={(e) => setDeliveryDeadlineEnd(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    />
                </FormControl>
                <FormControl maxW="100px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Status</FormLabel>
                    <Select
                        placeholder="Todos"
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        size="sm"
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
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovado</option>
                        <option value="REJECTED">Rejeitado</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                    </Select>
                </FormControl>
                <FormControl maxW="200px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Filial</FormLabel>
                    <Select
                        placeholder="Todas"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todas</option>
                        {Array.from(new Set(filteredRequests.map(r => r.location?.name).filter(Boolean))).map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl maxW="200px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Setor</FormLabel>
                    <Select
                        placeholder="Todos"
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todos</option>
                        {Array.from(new Set(filteredRequests.map(r => r.sector?.name).filter(Boolean))).map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl maxW="200px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Local de Entrega</FormLabel>
                    <Select
                        placeholder="Todos"
                        value={localeFilter}
                        onChange={(e) => setLocaleFilter(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todos</option>
                        {Array.from(new Set(filteredRequests.map(r => r.locale?.name).filter(Boolean))).map(locale => (
                            <option key={locale} value={locale}>{locale}</option>
                        ))}
                    </Select>
                </FormControl>
                <HStack spacing={2}>
                    <Button
                        size="sm"
                        onClick={onExportPDF}
                        colorScheme="blue"
                        isDisabled={filtered.length === 0}
                        minW="120px"
                        h="32px"
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s ease"
                    >
                        Exportar PDF
                    </Button>
                    <Button
                        size="sm"
                        onClick={onRefresh}
                        colorScheme="blue"
                        minW="120px"
                        h="32px"
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s ease"
                    >
                        Atualizar
                    </Button>
                    <Button
                        size="sm"
                        onClick={onClearFilters}
                        colorScheme="gray"
                        variant="outline"
                        minW="120px"
                        h="32px"
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s ease"
                    >
                        Limpar Filtros
                    </Button>
                </HStack>
            </Flex>

            {filtered.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={8}>
                    <Image
                        src="/Task-complete.svg"
                        alt="Nenhuma requisição encontrada"
                        maxW="300px"
                        mb={4}
                    />
                    <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="lg">
                        Nenhuma requisição encontrada
                    </Text>
                </Flex>
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Suprimento</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Usuário</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Quantidade</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Status</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Data da Solicitação</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Data Limite de Entrega</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Data de Entrega</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Local de Entrega</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filtered.map((request) => (
                                <Tr
                                    key={request.id}
                                    transition="all 0.3s ease"
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                                        transform: 'translateY(-1px)',
                                    }}
                                >
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.is_custom ? request.item_name : request.supply?.name}
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Text color={colorMode === 'dark' ? 'white' : 'gray.800'}>{request.user.name}</Text>
                                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                            {request.user.email}
                                        </Text>
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.quantity} {request.supply?.unit?.symbol || request.supply?.unit?.name}
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Badge
                                            colorScheme={
                                                request.status === 'APPROVED'
                                                    ? 'green'
                                                    : request.status === 'REJECTED'
                                                        ? 'red'
                                                        : request.status === 'DELIVERED'
                                                            ? 'purple'
                                                            : request.status === 'CANCELLED'
                                                                ? 'gray'
                                                                : 'yellow'
                                            }
                                        >
                                            {request.status === 'PENDING'
                                                ? 'Pendente'
                                                : request.status === 'APPROVED'
                                                    ? 'Aprovado'
                                                    : request.status === 'REJECTED'
                                                        ? 'Rejeitado'
                                                        : request.status === 'CANCELLED'
                                                            ? 'Cancelado'
                                                            : 'Entregue'}
                                        </Badge>
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {new Date(request.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.delivery_deadline ? new Date(request.delivery_deadline).toLocaleDateString('pt-BR') : '-'}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.status === 'DELIVERED' && request.updated_at ? new Date(request.updated_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.locale?.name || '-'}
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <VStack spacing={2} align="start">
                                            <HStack>
                                                <Text fontSize="sm">Requerente:</Text>
                                                <Badge colorScheme={request.requester_confirmation ? 'green' : 'gray'}>
                                                    {request.requester_confirmation ? 'Confirmado' : 'Pendente'}
                                                </Badge>
                                            </HStack>
                                            <HStack>
                                                <Text fontSize="sm">Gerente:</Text>
                                                <Badge colorScheme={request.manager_delivery_confirmation ? 'green' : 'gray'}>
                                                    {request.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                                                </Badge>
                                            </HStack>
                                            {request.status === 'PENDING' && (
                                                <HStack spacing={2} mt={2}>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="green"
                                                        leftIcon={<CheckCircle size={14} />}
                                                        onClick={() => onApprove(request.id, 'APPROVED')}
                                                        minW="100px"
                                                        h="32px"
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                        _hover={{
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: 'md',
                                                        }}
                                                        transition="all 0.2s ease"
                                                    >
                                                        Aprovar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="red"
                                                        leftIcon={<XCircle size={14} />}
                                                        onClick={() => onReject(request.id, 'REJECTED')}
                                                        minW="100px"
                                                        h="32px"
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                        _hover={{
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: 'md',
                                                        }}
                                                        transition="all 0.2s ease"
                                                    >
                                                        Rejeitar
                                                    </Button>
                                                </HStack>
                                            )}
                                            {request.status === 'APPROVED' && !request.manager_delivery_confirmation && (
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    leftIcon={<CheckCircle size={14} />}
                                                    onClick={() => onConfirmDelivery(request, true)}
                                                    minW="140px"
                                                    h="32px"
                                                    fontSize="xs"
                                                    fontWeight="medium"
                                                    mt={2}
                                                    _hover={{
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: 'md',
                                                    }}
                                                    transition="all 0.2s ease"
                                                >
                                                    Confirmar Entrega
                                                </Button>
                                            )}
                                        </VStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}
        </>
    );
} 