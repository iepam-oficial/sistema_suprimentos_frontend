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
import { CheckCircle, XCircle, FileText, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface AllocationRequest {
    id: string;
    inventory: {
        id: string;
        name: string;
        description: string;
        model: string;
        serial_number: string;
    };
    requester: {
        id: string;
        name: string;
        email: string;
    };
    destination: string;
    destination_name?: string;
    destination_id?: string;
    locale_name?: string;
    location_name?: string;
    requester_sector?: string;
    notes: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED' | 'RETURNED' | 'LOST';
    created_at: string;
    return_date: string;
    requester_delivery_confirmation: boolean;
    manager_delivery_confirmation: boolean;
    manager_return_confirmation: boolean;
}

interface AllocationsTabProps {
    allocationRequests: AllocationRequest[];
    filteredAllocationRequests: AllocationRequest[];
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
    onAllocationManagerReturnConfirmation: (request: AllocationRequest) => void;
    onAllocationMarkAsLost: (request: AllocationRequest) => void;
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
    returnDateFilter,
    onReturnDateFilterChange,
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
    const colorMode = useColorModeValue('light', 'dark');
    const [returnStart, setReturnStart] = useState('');
    const [returnEnd, setReturnEnd] = useState('');
    const [localSector, setLocalSector] = useState('');
    const [localLocation, setLocalLocation] = useState('');
    const [localLocale, setLocalLocale] = useState('');
    const [localRequester, setLocalRequester] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const filtered = allocationRequests
        .filter(r => {
            if (!returnStart && !returnEnd) return true;
            if (!r.return_date) return false;
            const ret = new Date(r.return_date);
            const start = returnStart ? new Date(returnStart) : null;
            const end = returnEnd ? new Date(returnEnd) : null;
            if (start && end) return ret >= start && ret <= end;
            if (start) return ret >= start;
            if (end) return ret <= end;
            return true;
        })
        .filter(r => !localSector || (r.requester_sector && r.requester_sector === localSector))
        .filter(r => !localLocation || (r.location_name && r.location_name === localLocation))
        .filter(r => !localLocale || (r.locale_name && r.locale_name === localLocale))
        .filter(r => !localRequester || (r.requester?.name && r.requester.name === localRequester))
        .filter(r => !statusFilter || r.status === statusFilter)
        .filter(r => !search || (
            r.inventory.name.toLowerCase().includes(search.toLowerCase()) ||
            r.inventory.model.toLowerCase().includes(search.toLowerCase()) ||
            r.inventory.serial_number.toLowerCase().includes(search.toLowerCase()) ||
            r.requester.name.toLowerCase().includes(search.toLowerCase()) ||
            r.requester.email.toLowerCase().includes(search.toLowerCase())
        ));

    if (isMobile) {
        return (
            <Box bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'} p={1} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} backdropFilter="blur(12px)">
                <InputGroup size="md" mb={3}>
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
                                        <option value="RETURNED">Devolvido</option>
                                        <option value="LOST">Perdido</option>
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Filial</FormLabel>
                                    <Select value={localLocation} onChange={(e) => setLocalLocation(e.target.value)} size="sm">
                                        <option value="">Todas</option>
                                        {Array.from(new Set(allocationRequests.map(r => r.location_name).filter(Boolean))).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Setor</FormLabel>
                                    <Select value={localSector} onChange={(e) => setLocalSector(e.target.value)} size="sm">
                                        <option value="">Todos</option>
                                        {Array.from(new Set(allocationRequests.map(r => r.requester_sector).filter(Boolean))).map(sector => (
                                            <option key={sector} value={sector}>{sector}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Local</FormLabel>
                                    <Select value={localLocale} onChange={(e) => setLocalLocale(e.target.value)} size="sm">
                                        <option value="">Todos</option>
                                        {Array.from(new Set(allocationRequests.map(r => r.locale_name).filter(Boolean))).map(locale => (
                                            <option key={locale} value={locale}>{locale}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Requerente</FormLabel>
                                    <Select value={localRequester} onChange={(e) => setLocalRequester(e.target.value)} size="sm">
                                        <option value="">Todos</option>
                                        {Array.from(new Set(allocationRequests.map(r => r.requester?.name).filter(Boolean))).map(req => (
                                            <option key={req} value={req}>{req}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Retorno (início)</FormLabel>
                                    <Input type="date" value={returnStart} onChange={(e) => setReturnStart(e.target.value)} size="sm" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel color={colorMode === 'dark' ? 'white' : 'gray.800'}>Retorno (fim)</FormLabel>
                                    <Input type="date" value={returnEnd} onChange={(e) => setReturnEnd(e.target.value)} size="sm" />
                                </FormControl>
                                <Button w="full" size="md" colorScheme="gray" variant="outline" mt={4} onClick={() => {
                                    onClearFilters();
                                    setLocalLocation('');
                                    setLocalSector('');
                                    setLocalLocale('');
                                    setLocalRequester('');
                                    setReturnStart('');
                                    setReturnEnd('');
                                    onClose();
                                }}>Limpar Filtros</Button>
                            </VStack>
                        </DrawerBody>
                        <DrawerFooter borderTopWidth="1px">
                            <Button variant="outline" mr={3} onClick={onClose}>Fechar</Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
                {filteredAllocationRequests.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" py={8}>
                        <Image src="/Task-complete.svg" alt="Nenhuma alocação encontrada" maxW="200px" mb={4} />
                        <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="md">Nenhuma alocação encontrada</Text>
                    </Flex>
                ) : (
                    <VStack spacing={3} align="stretch">
                        {filteredAllocationRequests.map((request) => (
                            <Box key={request.id} p={1} borderRadius="md" boxShadow="sm" bg={colorMode === 'dark' ? 'rgba(45,55,72,0.7)' : 'white'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'gray.200'}>
                                <Text fontWeight="bold">{request.inventory.name}</Text>
                                <Text fontSize="sm" color="gray.500">{request.requester.name} - {request.requester.email}</Text>
                                <Text fontSize="sm">Modelo: {request.inventory.model}</Text>
                                <Text fontSize="sm">Série: {request.inventory.serial_number}</Text>
                                <Badge colorScheme={request.status === 'APPROVED' ? 'green' : request.status === 'REJECTED' ? 'red' : request.status === 'DELIVERED' ? 'purple' : request.status === 'RETURNED' ? 'blue' : request.status === 'LOST' ? 'purple' : 'yellow'} mt={1} mb={1}>
                                    {request.status === 'PENDING' ? 'Pendente' : request.status === 'APPROVED' ? 'Aprovado' : request.status === 'REJECTED' ? 'Rejeitado' : request.status === 'DELIVERED' ? 'Entregue' : request.status === 'LOST' ? 'Perdido' : 'Devolvido'}
                                </Badge>
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
                                            minW="140px"
                                            h="32px"
                                            fontSize="xs"
                                            fontWeight="medium"
                                            _hover={{
                                                transform: 'translateY(-1px)',
                                                boxShadow: 'md',
                                            }}
                                            transition="all 0.2s ease"
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
                )}
            </Box>
        );
    }

    return (
        <>
            <Flex gap={4} mb={4} flexWrap="wrap" align="end">
                <FormControl maxW="320px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Buscar por item ou usuário</FormLabel>
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
                        />
                    </InputGroup>
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Retorno (início)</FormLabel>
                    <Input
                        type="date"
                        value={returnStart}
                        onChange={(e) => setReturnStart(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    />
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Retorno (fim)</FormLabel>
                    <Input
                        type="date"
                        value={returnEnd}
                        onChange={(e) => setReturnEnd(e.target.value)}
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
                >
                    <option value="">Todos</option>
                    <option value="PENDING">Pendente</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="REJECTED">Rejeitado</option>
                                        <option value="DELIVERED">Entregue</option>
                                        <option value="RETURNED">Devolvido</option>
                                        <option value="LOST">Perdido</option>
                                    </Select>
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Filial</FormLabel>
                    <Select
                        placeholder="Todas"
                        value={localLocation}
                        onChange={(e) => setLocalLocation(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todas</option>
                        {Array.from(new Set(allocationRequests.map(r => r.location_name).filter(Boolean))).map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Setor</FormLabel>
                    <Select
                        placeholder="Todos"
                        value={localSector}
                        onChange={(e) => setLocalSector(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todos</option>
                        {Array.from(new Set(allocationRequests.map(r => r.requester_sector).filter(Boolean))).map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Local</FormLabel>
                    <Select
                        placeholder="Todos"
                        value={localLocale}
                        onChange={(e) => setLocalLocale(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todos</option>
                        {Array.from(new Set(allocationRequests.map(r => r.locale_name).filter(Boolean))).map(locale => (
                            <option key={locale} value={locale}>{locale}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl maxW="130px">
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Requerente</FormLabel>
                    <Select
                        placeholder="Todos"
                        value={localRequester}
                        onChange={(e) => setLocalRequester(e.target.value)}
                        size="sm"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    >
                        <option value="">Todos</option>
                        {Array.from(new Set(allocationRequests.map(r => r.requester?.name).filter(Boolean))).map(req => (
                            <option key={req} value={req}>{req}</option>
                        ))}
                    </Select>
                </FormControl>
                <HStack spacing={3} ml="auto" alignSelf="end">
                    <Button
                        size="sm"
                        onClick={onExportPDF}
                        colorScheme="blue"
                        leftIcon={<FileText size={16} />}
                        isDisabled={filteredAllocationRequests.length === 0}
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
                </HStack>
            </Flex>

            {filteredAllocationRequests.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={8}>
                    <Image
                        src="/Task-complete.svg"
                        alt="Nenhuma alocação encontrada"
                        maxW="300px"
                        mb={4}
                    />
                    <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="lg">
                        Nenhuma alocação encontrada
                    </Text>
                </Flex>
            ) : (
                <Box overflowX="auto">
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Item</Th>
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
                            {filteredAllocationRequests.map((request) => (
                                <Tr
                                    key={request.id}
                                    transition="all 0.3s ease"
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                                        transform: 'translateY(-1px)',
                                    }}
                                >
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <VStack align="start" spacing={1}>
                                            <Text fontWeight="bold">{request.inventory.name}</Text>
                                            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                                {request.inventory.model} - {request.inventory.serial_number}
                                            </Text>
                                        </VStack>
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <Text color={colorMode === 'dark' ? 'white' : 'gray.800'}>{request.requester.name}</Text>
                                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                            {request.requester.email}
                                        </Text>
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        1
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
                                                            : request.status === 'RETURNED'
                                                                ? 'blue'
                                                                : request.status === 'LOST'
                                                                    ? 'purple'
                                                                    : 'yellow'
                                            }
                                        >
                                            {request.status === 'PENDING'
                                                ? 'Pendente'
                                                : request.status === 'APPROVED'
                                                    ? 'Aprovado'
                                                    : request.status === 'REJECTED'
                                                        ? 'Rejeitado'
                                                        : request.status === 'DELIVERED'
                                                            ? 'Entregue'
                                                            : request.status === 'LOST'
                                                                ? 'Perdido'
                                                                : 'Devolvido'}
                                        </Badge>
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.created_at ? new Date(request.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Não definida'}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.return_date ? new Date(request.return_date).toLocaleDateString('pt-BR') : '-'}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.status === 'DELIVERED' && request.manager_delivery_confirmation ? new Date(request.return_date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </Td>
                                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        {request.locale_name || '-'}
                                    </Td>
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <HStack spacing={2}>
                                            {request.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="green"
                                                        leftIcon={<CheckCircle size={14} />}
                                                        onClick={() => onAllocationApprove(request.id, 'APPROVED')}
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
                                                        onClick={() => onAllocationReject(request.id, 'REJECTED')}
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
                                                </>
                                            )}
                                            {request.status === 'APPROVED' && !request.manager_delivery_confirmation && (
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    leftIcon={<CheckCircle size={14} />}
                                                    onClick={() => onAllocationConfirmDelivery(request, true)}
                                                    minW="140px"
                                                    h="32px"
                                                    fontSize="xs"
                                                    fontWeight="medium"
                                                    _hover={{
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: 'md',
                                                    }}
                                                    transition="all 0.2s ease"
                                                >
                                                    Confirmar Entrega
                                                </Button>
                                            )}
                                            {request.status === 'RETURNED' && !request.manager_return_confirmation && (
                                                <Button
                                                    size="sm"
                                                    colorScheme="purple"
                                                    leftIcon={<CheckCircle size={14} />}
                                                    onClick={() => onAllocationManagerReturnConfirmation(request)}
                                                    minW="140px"
                                                    h="32px"
                                                    fontSize="xs"
                                                    fontWeight="medium"
                                                    _hover={{
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: 'md',
                                                    }}
                                                    transition="all 0.2s ease"
                                                >
                                                    Confirmar Devolução
                                                </Button>
                                            )}
                                            {request.status === 'DELIVERED' && (
                                                <Button
                                                    size="sm"
                                                    colorScheme="purple"
                                                    variant="outline"
                                                    onClick={() => onAllocationMarkAsLost(request)}
                                                    minW="140px"
                                                    h="32px"
                                                    fontSize="xs"
                                                    fontWeight="medium"
                                                    _hover={{
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: 'md',
                                                    }}
                                                    transition="all 0.2s ease"
                                                >
                                                    Marcar como perdido
                                                </Button>
                                            )}
                                        </HStack>
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