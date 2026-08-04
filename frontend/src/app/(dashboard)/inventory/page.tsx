'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Flex,
    Heading,
    useDisclosure,
    useToast,
    VStack,
    useBreakpointValue,
    useColorMode,
} from '@chakra-ui/react';
import { Chart, registerables } from 'chart.js';
import { filterItems } from './utils/filterUtils';
import { MobileView, DesktopView } from './components/ItemViews';
import { InventoryItem, GroupByOption } from './types';
import { groupItems } from './utils/groupUtils';
import { InventoryHeader } from './components/InventoryHeader';
import { InventoryFilters } from './components/InventoryFilters';
import { InventoryModal } from './components/InventoryModal';
import { InventoryQuickEditDrawer } from './components/InventoryQuickEditDrawer';
import { exportInventoryPDF } from './utils/exportInventoryPDF';
import {
  fetchItems,
  fetchCategories,
  fetchSubcategories,
  createItem,
  updateItem,
  deleteItem,
  depreciateAll
} from './utils/inventoryApi';

export default function InventoryPage() {
    const router = useRouter();
    const [groupBy, setGroupBy] = useState<GroupByOption>('none');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
    const [subcategories, setSubcategories] = useState<{ id: string; label: string }[]>([]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
        isOpen: isQuickEditOpen,
        onOpen: onQuickEditOpen,
        onClose: onQuickEditClose,
    } = useDisclosure();
    const toast = useToast();
    const { colorMode } = useColorMode();
    Chart.register(...registerables);
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
    const [quickEditItem, setQuickEditItem] = useState<InventoryItem | null>(null);
    const [isQuickEditSaving, setIsQuickEditSaving] = useState(false);
    const token = typeof window !== 'undefined' ? localStorage.getItem('@ti-assistant:token') : null;

    const handleInternalCodeGenerated = (updated: InventoryItem) => {
        setItems((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
        setQuickEditItem((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
    };

    useEffect(() => {
        loadItems();
        loadCategories();
    }, []);

    const loadItems = async () => {
        try {
            const data = await fetchItems();
            if (!Array.isArray(data) && data.status === 429) {
                router.push('/rate-limit');
                return;
            }
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Inventory] Erro ao carregar inventário:', error);
            toast({
                title: 'Erro ao carregar inventário',
                description: 'Não foi possível carregar os itens do inventário.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setItems([]);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await fetchCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Inventory] Erro ao carregar categorias:', error);
            setCategories([]);
        }
    };

    const handleCategoryChange = async (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedSubcategory('');
        if (categoryId) {
            try {
                const data = await fetchSubcategories(categoryId);
                setSubcategories(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('[Inventory] Erro ao carregar subcategorias:', error);
                setSubcategories([]);
            }
        } else {
            setSubcategories([]);
        }
    };

    const handleCreate = async (data: any) => {
        try {
            const response = await createItem(data);
            if (!response.ok) throw new Error('Erro ao criar item');
            toast({
                title: 'Item criado',
                description: 'O item foi adicionado ao inventário com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            loadItems();
            onClose();
        } catch (error: any) {
            console.error('[Inventory] Erro ao criar item:', error);
            toast({
                title: 'Erro ao criar item',
                description: error.message || 'Não foi possível criar o item.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                const response = await deleteItem(id);
                if (!response.ok) throw new Error('Erro ao excluir item');
                toast({
                    title: 'Item excluído',
                    description: 'O item foi removido do inventário com sucesso.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                loadItems();
            } catch (error) {
                console.error('[Inventory] Erro ao excluir item:', error);
                toast({
                    title: 'Erro ao excluir item',
                    description: 'Não foi possível excluir o item.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    const handleExportPDF = async () => {
        try {
            await exportInventoryPDF(filteredItems, groupBy);
        } catch (error) {
            console.error('[Inventory] Erro ao exportar PDF:', error);
            toast({
                title: 'Erro ao exportar PDF',
                description: 'Não foi possível gerar o relatório em PDF.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setQuickEditItem(item);
        onQuickEditOpen();
    };

    const handleCloseQuickEdit = () => {
        setQuickEditItem(null);
        onQuickEditClose();
    };

    const handleQuickEditSave = async (data: {
        status: string;
        sector_id: string | null;
        locale_id: string | null;
    }) => {
        if (!quickEditItem) return;

        setIsQuickEditSaving(true);
        try {
            const response = await updateItem(quickEditItem.id, data);
            if (!response.ok) throw new Error('Erro ao atualizar item');

            setItems((prev) =>
                prev.map((item) => {
                    if (item.id !== quickEditItem.id) return item;

                    const locale = data.locale_id
                        ? item.locale?.id === data.locale_id
                            ? item.locale
                            : undefined
                        : undefined;

                    const sector =
                        data.sector_id && item.sector?.id === data.sector_id
                            ? item.sector
                            : data.sector_id
                              ? { id: data.sector_id, name: item.sector?.name ?? '' }
                              : undefined;

                    return {
                        ...item,
                        status: data.status as InventoryItem['status'],
                        sector_id: data.sector_id,
                        locale_id: data.locale_id,
                        locale,
                        sector,
                    };
                })
            );

            toast({
                title: 'Item atualizado',
                description: 'O item foi atualizado com sucesso.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            handleCloseQuickEdit();
        } catch (error: any) {
            console.error('[Inventory] Erro ao atualizar item:', error);
            toast({
                title: 'Erro ao atualizar item',
                description: error.message || 'Não foi possível atualizar o item.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsQuickEditSaving(false);
        }
    };

    const handleDepreciateAll = async () => {
        try {
            const data = await depreciateAll();
            toast({
                title: 'Depreciação atualizada',
                description: `${data.updated} itens atualizados com sucesso!`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            loadItems();
        } catch (error: any) {
            console.error('[Inventory] Erro ao atualizar depreciação:', error);
            toast({
                title: 'Erro ao atualizar depreciação',
                description: error.message || 'Não foi possível atualizar a depreciação dos itens.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const filteredItems = filterItems(items, searchTerm, selectedCategory, selectedSubcategory);
    const groupedItems = groupItems(filteredItems, groupBy);

    return (
        <Box h="100vh" display="flex" flexDirection="column" overflow="hidden" px={2} py={2}>
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
                <Flex
                    justify="space-between"
                    align="center"
                    gap={2}
                    flexWrap="wrap"
                    flexShrink={0}
                    direction={isMobile ? 'column' : 'row'}
                >
                    <Box flex={isMobile ? undefined : '1'} minW={isMobile ? undefined : '180px'} w={isMobile ? 'full' : undefined}>
                        <InventoryFilters
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            setSelectedSubcategory={setSelectedSubcategory}
                            categories={categories}
                            subcategories={subcategories}
                            isFilterOpen={isFilterOpen}
                            onFilterOpen={onFilterOpen}
                            onFilterClose={onFilterClose}
                            handleCategoryChange={handleCategoryChange}
                        />
                    </Box>
                    <InventoryHeader
                        onOpen={onOpen}
                        onExportPDF={handleExportPDF}
                        onDepreciateAll={handleDepreciateAll}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                    />
                </Flex>

                <Box flex="1" minH={0} overflowY="auto">
                    {Object.entries(groupedItems).map(([groupName, groupItemsList]) => (
                        <Box key={groupName} mb={4}>
                            <Heading size="sm" mb={2} color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                                {groupName} ({groupItemsList.length})
                            </Heading>
                            {isMobile ? (
                                <MobileView
                                    items={groupItemsList}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                    token={token}
                                    onInternalCodeGenerated={handleInternalCodeGenerated}
                                />
                            ) : (
                                <DesktopView
                                    items={groupItemsList}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                    token={token}
                                    onInternalCodeGenerated={handleInternalCodeGenerated}
                                />
                            )}
                        </Box>
                    ))}
                </Box>
            </VStack>

            <InventoryModal
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={handleCreate}
                isEdit={false}
                onInternalCodeGenerated={handleInternalCodeGenerated}
            />

            <InventoryQuickEditDrawer
                item={quickEditItem}
                isOpen={isQuickEditOpen}
                onClose={handleCloseQuickEdit}
                onSave={handleQuickEditSave}
                isSaving={isQuickEditSaving}
            />
        </Box>
    );
}
