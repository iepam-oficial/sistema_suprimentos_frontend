'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
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
    Card,
    CardBody,
    Text,
    Badge,
    IconButton,
    Tooltip,
    useColorModeValue,
    HStack,
    VStack,
    Divider,
    useBreakpointValue,
    useColorMode,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiBarChart2, FiAlertTriangle } from 'react-icons/fi';
import { SupplyModal } from './components/SupplyModal';
import { MobileSupplies } from './components/MobileSupplies';
import { Supply } from './utils/types';
import { filterSupplies } from './utils/filterUtils';
import { exportSuppliesBelowMinimum } from './utils/exportUtils';
import { SupplyStatistics } from './components/SupplyStatistics';
import { SupplyBatchList } from './components/SupplyBatchList';
import { useRouter } from 'next/navigation';
import { fetchCategories as fetchCategoriesApi, type CategoryDTO } from '@/features/reference-data';

export default function SuppliesPage() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
    const { colorMode } = useColorMode();
    const router = useRouter();
    const isMobile = useBreakpointValue({ base: true, md: false });

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');

    useEffect(() => {
        fetchSupplies();
        loadCategories();
    }, []);

    const fetchSupplies = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            const response = await fetch('/api/supplies', {
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

    const handleCreate = async (data: any) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            const response = await fetch('/api/supplies', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Erro ao criar suprimento');
            }

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

    const handleEdit = async (data: any) => {
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

    const filteredSupplies = filterSupplies(supplies, searchTerm, selectedCategory);

    if (isMobile) {
        return (
            <MobileSupplies
                supplies={filteredSupplies}
                categories={categories}
                onSearch={setSearchTerm}
                onCategoryChange={setSelectedCategory}
                onDelete={handleDelete}
                onCreate={handleCreate}
                onEdit={handleEdit}
            />
        );
    }

    return (
        <>
            <Tabs variant="enclosed" colorScheme="blue">
                <TabList>
                    <Tab>Lista de Suprimentos</Tab>
                    <Tab>Estatísticas</Tab>
                    <Tab>Lotes</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
            <VStack
                spacing={4}
                align="stretch"
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                backdropFilter="blur(12px)"
                p={isMobile ? 0 : 3}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                
                overflow="hidden"
            >
                {!isMobile && (
                    <Flex justify="space-between" align="center" mb={3}>
                        <Heading size="lg" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Gerenciamento de Suprimentos</Heading>
                        <HStack spacing={2}>
                            <Button
                                colorScheme="orange"
                                onClick={handleExportBelowMinimum}
                                leftIcon={<FiAlertTriangle />}
                                bg={colorMode === 'dark' ? 'rgba(237, 137, 54, 0.8)' : undefined}
                                _hover={{
                                    bg: colorMode === 'dark' ? 'rgba(237, 137, 54, 0.9)' : undefined,
                                    transform: 'translateY(-1px)',
                                }}
                                transition="all 0.3s ease"
                            >
                                Abaixo do Mínimo
                            </Button>
                            <Button
                                leftIcon={<FiPlus />}
                                colorScheme="blue"
                                onClick={onOpen}
                                bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined}
                                _hover={{
                                    bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined,
                                    transform: 'translateY(-1px)',
                                }}
                                transition="all 0.3s ease"
                            >
                                Novo Suprimento
                            </Button>
                        </HStack>
                    </Flex>
                )}

                <HStack spacing={2} wrap="wrap">
                    <InputGroup maxW="400px">
                        <InputLeftElement pointerEvents="none">
                            <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                        </InputLeftElement>
                        <Input
                            placeholder="Buscar suprimentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                        placeholder="Filtrar por categoria"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
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
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.label}
                            </option>
                        ))}
                    </Select>
                </HStack>

                <Divider />

                <Box
                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                    p={6}
                    borderRadius="lg"
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    backdropFilter="blur(12px)"
                    overflowX="auto"
                    flex="1"
                    overflowY="auto"
                                maxH="60vh"
                >
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Nome</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Descrição</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Quantidade</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Mínimo</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Unidade</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Categoria</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Fornecedor</Th>
                                <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)'}>Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredSupplies.map((supply) => (
                                <Tr
                                    key={supply.id}
                                    transition="all 0.3s ease"
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                                        transform: 'translateY(-1px)',
                                    }}
                                >
                                    {[
                                        { value: supply.name },
                                        { value: supply.description },
                                        { value: supply.quantity },
                                        { value: supply.minimum_quantity },
                                        { value: supply.unit?.symbol ?? '' },
                                        { value: supply.category?.label ?? '' },
                                        { value: supply.supplier?.name ?? '' }
                                    ].map((cell, index) => (
                                        <Td 
                                            key={index}
                                            color={colorMode === 'dark' ? 'white' : 'gray.800'} 
                                            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                                        >
                                            {cell.value}
                                        </Td>
                                    ))}
                                    <Td bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}>
                                        <HStack spacing={2}>
                                            <Tooltip label="Editar">
                                                <IconButton
                                                    aria-label="Editar"
                                                    icon={<FiEdit2 />}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleOpenEdit(supply)}
                                                    _hover={{
                                                        bg: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                        transform: 'translateY(-1px)'
                                                    }}
                                                    transition="all 0.2s ease"
                                                />
                                            </Tooltip>
                                            <Tooltip label="Excluir">
                                                <IconButton
                                                    aria-label="Excluir"
                                                    icon={<FiTrash2 />}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() => handleDelete(supply.id)}
                                                    _hover={{
                                                        bg: colorMode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                                                        transform: 'translateY(-1px)'
                                                    }}
                                                    transition="all 0.2s ease"
                                                />
                                            </Tooltip>
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </VStack>
                    </TabPanel>
                    <TabPanel>
                        <SupplyStatistics />
                    </TabPanel>
                    <TabPanel>
                        <SupplyBatchList />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <SupplyModal
                isOpen={isOpen}
                onClose={handleClose}
                onSubmit={selectedSupply ? handleEdit : handleCreate}
                categories={categories}
                initialData={selectedSupply || undefined}
            />
        </>
    );
} 