'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useDisclosure,
    useToast,
    Text,
    Badge,
    IconButton,
    Tooltip,
    useColorModeValue,
    HStack,
    VStack,
    useBreakpointValue,
    useColorMode,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerCloseButton,
    DrawerFooter,
    FormControl,
    FormLabel,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { Filter } from 'lucide-react';
import { SupplyModal } from '@/features/catalog/components/SupplyModal';
import { SupplyInternalCodeDisplay } from '@/features/catalog/components/SupplyInternalCodeDisplay';
import { createSupply } from '@/features/catalog/api/catalogApi';

import { NewBatchModal } from './components/NewBatchModal';
import { MobileSupplies } from './components/MobileSupplies';
import { useUser } from '@/features/identity';
import { Supply } from './utils/types';
import { filterSupplies, type SupplyAbcFilter, type SupplyVisibilityFilter } from './utils/filterUtils';
import { exportSuppliesBelowMinimum } from './utils/exportUtils';
import { SupplyBatchList } from './components/SupplyBatchList';
import { useRouter } from 'next/navigation';
import { fetchCategories as fetchCategoriesApi, type CategoryDTO } from '@/features/reference-data';
import type { CreateSupplyInput } from '@/features/catalog/types';
import {
    abcBadgeColorScheme,
    abcBadgeLabel,
    formatAbcDisplay,
} from '@/features/catalog/abcClassification';

export default function SuppliesPage() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedVisibility, setSelectedVisibility] = useState<SupplyVisibilityFilter>('');
    const [selectedAbc, setSelectedAbc] = useState<SupplyAbcFilter>('');
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
    const { isOpen: isBatchOpen, onOpen: onBatchOpen, onClose: onBatchClose } = useDisclosure();
    const toast = useToast();
    const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
    const { user } = useUser();
    const isManager = !!user && ['ADMIN', 'MANAGER'].includes(user.role);
    const token = typeof window !== 'undefined' ? localStorage.getItem('@ti-assistant:token') : null;
    const { colorMode } = useColorMode();
    const router = useRouter();
    const isMobile = useBreakpointValue({ base: true, md: false });

    const handleInternalCodeGenerated = (updated: Supply) => {
        setSupplies((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
        setSelectedSupply((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
    };

    const drawerBg = useColorModeValue('white', 'gray.800');
    const drawerBorder = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');
    const inputBg = useColorModeValue('white', 'gray.700');
    const inputBorder = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        if (user) {
            fetchSupplies();
        }
        loadCategories();
    }, [user?.role]);

    const fetchSupplies = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            const audience = isManager ? 'manager' : 'requester';
            const response = await fetch(`/api/supplies?audience=${audience}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 429) {
                router.push('/rate-limit');
                return;
            }

            const data = await response.json();
            setSupplies(Array.isArray(data) ? data : []);
        } catch (error) {
            toast({
                title: 'Erro ao carregar suprimentos',
                description: 'Não foi possível carregar os suprimentos.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setSupplies([]);
        }
    };

    const loadCategories = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) return;
            const data = await fetchCategoriesApi(token);
            setCategories(data);
        } catch (error) {
            setCategories([]);
        }
    };

    const handleCreate = async (data: CreateSupplyInput) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            if (!token) {
                throw new Error('Token não encontrado');
            }
            await createSupply(token, data);

            toast({
                title: 'Suprimento criado',
                description: 'O suprimento foi adicionado com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchSupplies();
            onClose();
        } catch (error: any) {
            toast({
                title: 'Erro ao criar suprimento',
                description: error.message || 'Não foi possível criar o suprimento.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este suprimento?')) {
            try {
                const token = localStorage.getItem('@ti-assistant:token')
                const response = await fetch(`/api/supplies/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Erro ao excluir suprimento');
                }

                toast({
                    title: 'Suprimento excluído',
                    description: 'O suprimento foi removido com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                fetchSupplies();
            } catch (error) {
                toast({
                    title: 'Erro ao excluir suprimento',
                    description: 'Não foi possível excluir o suprimento.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    const handleExportBelowMinimum = async () => {
        try {
            await exportSuppliesBelowMinimum(supplies);
            toast({
                title: 'Relatório gerado',
                description: 'O relatório de suprimentos abaixo do mínimo foi gerado com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Erro ao gerar relatório',
                description: 'Não foi possível gerar o relatório de suprimentos abaixo do mínimo.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleEdit = async (data: CreateSupplyInput) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            const response = await fetch(`/api/supplies/${selectedSupply?.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar suprimento');
            }

            toast({
                title: 'Suprimento atualizado',
                description: 'O suprimento foi atualizado com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchSupplies();
            onClose();
            setSelectedSupply(null);
        } catch (error: any) {
            toast({
                title: 'Erro ao atualizar suprimento',
                description: error.message || 'Não foi possível atualizar o suprimento.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleOpenEdit = (supply: Supply) => {
        setSelectedSupply(supply);
        onOpen();
    };

    const handleClose = () => {
        setSelectedSupply(null);
        onClose();
    };

    const filteredSupplies = filterSupplies(
        supplies,
        searchTerm,
        selectedCategory,
        selectedVisibility,
        selectedAbc
    );
    const filtersActive = Boolean(selectedCategory || selectedVisibility || selectedAbc);

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedVisibility('');
        setSelectedAbc('');
    };

    if (isMobile) {
        return (
            <>
                <MobileSupplies
                    supplies={filteredSupplies}
                    categories={categories}
                    isManager={isManager}
                    onSearch={setSearchTerm}
                    selectedCategory={selectedCategory}
                    selectedVisibility={selectedVisibility}
                    selectedAbc={selectedAbc}
                    onCategoryChange={setSelectedCategory}
                    onVisibilityChange={setSelectedVisibility}
                    onAbcChange={setSelectedAbc}
                    filtersActive={filtersActive}
                    onClearFilters={clearFilters}
                    onDelete={handleDelete}
                    onCreate={handleCreate}
                    onEdit={handleEdit}
                    onNewBatch={onBatchOpen}
                    onSupplyUpdated={handleInternalCodeGenerated}
                />
                {isManager && (
                    <NewBatchModal
                        isOpen={isBatchOpen}
                        onClose={onBatchClose}
                        onSuccess={fetchSupplies}
                    />
                )}
            </>
        );
    }

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
            >
                <TabList flexShrink={0}>
                    <Tab>Lista de Suprimentos</Tab>
                    {isManager && <Tab>Lotes</Tab>}
                </TabList>
                <TabPanels flex="1" minH={0} overflow="hidden">
                    <TabPanel p={2} h="full" display="flex" flexDirection="column" minH={0}>
            <VStack
                spacing={2}
                align="stretch"
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                backdropFilter="blur(12px)"
                p={2}
                borderRadius="md"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                flex="1"
                minH={0}
                overflow="hidden"
            >
                <Flex justify="space-between" align="center" gap={2} flexWrap="wrap" flexShrink={0}>
                    <HStack spacing={2} flex="1" minW="180px">
                        <InputGroup maxW="320px" flex="1" size="sm">
                            <InputLeftElement pointerEvents="none" h="full">
                                <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                            </InputLeftElement>
                            <Input
                                placeholder="Buscar suprimentos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
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
                        <Tooltip label="Filtros">
                            <Box position="relative">
                                <IconButton
                                    aria-label="Filtros"
                                    icon={<Filter size={16} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={onFilterOpen}
                                />
                                {filtersActive && (
                                    <Badge
                                        position="absolute"
                                        top="-1"
                                        right="-1"
                                        borderRadius="full"
                                        boxSize="2.5"
                                        colorScheme="blue"
                                        p={0}
                                    />
                                )}
                            </Box>
                        </Tooltip>
                    </HStack>
                    {isManager && (
                        <HStack spacing={1} flexShrink={0}>
                            <Button
                                size="sm"
                                colorScheme="orange"
                                onClick={handleExportBelowMinimum}
                                leftIcon={<FiAlertTriangle />}
                            >
                                Abaixo do Mínimo
                            </Button>
                            <Button
                                size="sm"
                                leftIcon={<FiPackage />}
                                colorScheme="teal"
                                onClick={onBatchOpen}
                            >
                                Novo Lote
                            </Button>
                            <Button
                                size="sm"
                                leftIcon={<FiPlus />}
                                colorScheme="blue"
                                onClick={onOpen}
                            >
                                Novo Suprimento
                            </Button>
                        </HStack>
                    )}
                </Flex>

                <Box
                    flex="1"
                    minH={0}
                    overflowX="auto"
                    overflowY="auto"
                    borderWidth="1px"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    borderRadius="md"
                >
                    <Table size="sm" variant="simple">
                        <Thead position="sticky" top={0} zIndex={1}>
                            <Tr>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Nome</Th>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Descrição</Th>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Disponível</Th>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Mínimo</Th>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Unidade</Th>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Categoria</Th>
                                <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Classe ABC</Th>
                                {isManager && (
                                    <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Visível</Th>
                                )}
                                {isManager && (
                                    <Th py={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>Ações</Th>
                                )}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredSupplies.map((supply) => (
                                <Tr
                                    key={supply.id}
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'gray.50',
                                    }}
                                >
                                    <Td
                                        py={1.5}
                                        px={2}
                                        color={colorMode === 'dark' ? 'white' : 'gray.800'}
                                        fontSize="sm"
                                        maxW="200px"
                                    >
                                        <Box>
                                            <Text
                                                color={colorMode === 'dark' ? 'white' : 'gray.800'}
                                                fontSize="sm"
                                                isTruncated
                                            >
                                                {supply.name}
                                            </Text>
                                            {isManager && token && (
                                                <SupplyInternalCodeDisplay
                                                    supplyId={supply.id}
                                                    internalCode={supply.internal_code}
                                                    token={token}
                                                    onGenerated={handleInternalCodeGenerated}
                                                    variant="list"
                                                />
                                            )}
                                        </Box>
                                    </Td>
                                    {[
                                        { value: supply.description },
                                        { value: supply.available_quantity },
                                        { value: supply.minimum_quantity },
                                        { value: supply.unit?.symbol ?? '' },
                                        { value: supply.category?.label ?? '' },
                                    ].map((cell, index) => (
                                        <Td
                                            key={index}
                                            py={1.5}
                                            px={2}
                                            color={colorMode === 'dark' ? 'white' : 'gray.800'}
                                            fontSize="sm"
                                            maxW="200px"
                                            isTruncated
                                        >
                                            {cell.value}
                                        </Td>
                                    ))}
                                    <Td py={1.5} px={2}>
                                        {supply.abc_classification != null ? (
                                            <Badge
                                                size="sm"
                                                colorScheme={abcBadgeColorScheme(supply.abc_classification)}
                                            >
                                                {abcBadgeLabel(supply.abc_classification)}
                                            </Badge>
                                        ) : (
                                            <Text
                                                as="span"
                                                color={colorMode === 'dark' ? 'white' : 'gray.800'}
                                                fontSize="sm"
                                            >
                                                {formatAbcDisplay(null)}
                                            </Text>
                                        )}
                                    </Td>
                                    {isManager && (
                                        <Td py={1.5} px={2}>
                                            <Badge size="sm" colorScheme={supply.visible_to_requesters ? 'green' : 'gray'}>
                                                {supply.visible_to_requesters ? 'Sim' : 'Não'}
                                            </Badge>
                                        </Td>
                                    )}
                                    {isManager && (
                                        <Td py={1} px={2}>
                                            <HStack spacing={0}>
                                                <Tooltip label="Editar">
                                                    <IconButton
                                                        aria-label="Editar"
                                                        icon={<FiEdit2 />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => handleOpenEdit(supply)}
                                                    />
                                                </Tooltip>
                                                <Tooltip label="Excluir">
                                                    <IconButton
                                                        aria-label="Excluir"
                                                        icon={<FiTrash2 />}
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={() => handleDelete(supply.id)}
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </Td>
                                    )}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>

            <Drawer isOpen={isFilterOpen} placement="right" onClose={onFilterClose} size="sm">
                <DrawerOverlay />
                <DrawerContent bg={drawerBg} borderLeft="1px solid" borderColor={drawerBorder}>
                    <DrawerCloseButton />
                    <DrawerHeader color={textColor} borderBottom="1px solid" borderColor={drawerBorder}>
                        <HStack spacing={2}>
                            <Filter size={20} />
                            <Text>Filtros</Text>
                        </HStack>
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack spacing={4} pt={4} align="stretch">
                            <FormControl>
                                <FormLabel color={textColor} fontSize="sm">Categoria</FormLabel>
                                <Select
                                    placeholder="Todas as categorias"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    bg={inputBg}
                                    borderColor={inputBorder}
                                    size="sm"
                                >
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            {isManager && (
                                <FormControl>
                                    <FormLabel color={textColor} fontSize="sm">Visibilidade</FormLabel>
                                    <Select
                                        value={selectedVisibility}
                                        onChange={(e) => setSelectedVisibility(e.target.value as SupplyVisibilityFilter)}
                                        bg={inputBg}
                                        borderColor={inputBorder}
                                        size="sm"
                                    >
                                        <option value="">Todas</option>
                                        <option value="visible">Visível</option>
                                        <option value="hidden">Oculto</option>
                                    </Select>
                                </FormControl>
                            )}
                            <FormControl>
                                <FormLabel color={textColor} fontSize="sm">Classe ABC</FormLabel>
                                <Select
                                    value={selectedAbc}
                                    onChange={(e) => setSelectedAbc(e.target.value as SupplyAbcFilter)}
                                    bg={inputBg}
                                    borderColor={inputBorder}
                                    size="sm"
                                >
                                    <option value="">Todas</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="UNCLASSIFIED">Não classificado</option>
                                </Select>
                            </FormControl>
                        </VStack>
                    </DrawerBody>
                    <DrawerFooter borderTop="1px solid" borderColor={drawerBorder}>
                        <Button
                            variant="outline"
                            size="sm"
                            w="full"
                            onClick={clearFilters}
                            isDisabled={!filtersActive}
                        >
                            Limpar filtros
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
                    </TabPanel>
                    {isManager && (
                        <TabPanel p={2} h="full" display="flex" flexDirection="column" minH={0} overflow="auto">
                            <SupplyBatchList />
                        </TabPanel>
                    )}
                </TabPanels>
            </Tabs>

            {isManager && (
                <>
                    <SupplyModal
                        isOpen={isOpen}
                        onClose={handleClose}
                        onSubmit={selectedSupply ? handleEdit : handleCreate}
                        categories={categories}
                        initialData={selectedSupply || undefined}
                        onInternalCodeGenerated={handleInternalCodeGenerated}
                    />
                    <NewBatchModal
                        isOpen={isBatchOpen}
                        onClose={onBatchClose}
                        onSuccess={fetchSupplies}
                    />
                </>
            )}
        </Box>
    );
} 