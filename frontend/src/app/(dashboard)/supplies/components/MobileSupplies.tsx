import {
    Box,
    Button,
    VStack,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    useColorMode,
    useDisclosure,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerCloseButton,
    DrawerFooter,
    FormControl,
    FormLabel,
    IconButton,
    Text,
    Badge,
    Card,
    CardBody,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { Supply } from '../utils/types';
import type { SupplyVisibilityFilter } from '../utils/filterUtils';
import { SupplyModal } from '../components/SupplyModal';
import { useState } from 'react';
import type { CreateSupplyInput } from '@/features/catalog/types';

interface MobileSuppliesProps {
    supplies: Supply[];
    categories: { id: string; label: string }[];
    isManager?: boolean;
    onSearch: (term: string) => void;
    selectedCategory: string;
    selectedVisibility: SupplyVisibilityFilter;
    onCategoryChange: (category: string) => void;
    onVisibilityChange: (visibility: SupplyVisibilityFilter) => void;
    filtersActive: boolean;
    onClearFilters: () => void;
    onDelete: (id: string) => void;
    onCreate: (data: CreateSupplyInput) => void;
    onEdit: (data: CreateSupplyInput) => void;
    onNewBatch?: () => void;
}

export function MobileSupplies({
    supplies,
    categories,
    isManager = false,
    onSearch,
    selectedCategory,
    selectedVisibility,
    onCategoryChange,
    onVisibilityChange,
    filtersActive,
    onClearFilters,
    onDelete,
    onCreate,
    onEdit,
    onNewBatch,
}: MobileSuppliesProps) {
    const { colorMode } = useColorMode();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
    const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);

    const handleOpenEdit = (supply: Supply) => {
        setSelectedSupply(supply);
        onOpen();
    };

    const handleClose = () => {
        setSelectedSupply(null);
        onClose();
    };

    return (
        <Box w="full" h="100vh" display="flex" flexDirection="column" overflow="hidden" pt={12} px={2} pb={2}>
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
                <HStack spacing={2} flexShrink={0}>
                    <InputGroup size="sm" flex="1">
                        <InputLeftElement pointerEvents="none" h="full">
                            <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                        </InputLeftElement>
                        <Input
                            placeholder="Buscar suprimentos..."
                            onChange={(e) => onSearch(e.target.value)}
                            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        />
                    </InputGroup>
                    <Box position="relative" flexShrink={0}>
                        <IconButton
                            aria-label="Filtros"
                            icon={<FiFilter />}
                            size="sm"
                            variant="outline"
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
                </HStack>

                {isManager && (
                    <HStack spacing={1} flexWrap="wrap" flexShrink={0}>
                        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen} size="xs" flex="1" minW="100px">
                            Novo
                        </Button>
                        <Button leftIcon={<FiPackage />} colorScheme="teal" onClick={onNewBatch} size="xs" flex="1" minW="100px">
                            Lote
                        </Button>
                        <Button leftIcon={<FiAlertTriangle />} colorScheme="orange" size="xs" flex="1" minW="100px">
                            Mínimo
                        </Button>
                    </HStack>
                )}

                <VStack spacing={2} align="stretch" overflowY="auto" flex="1" minH={0}>
                    {supplies.map((supply) => (
                        <Card
                            key={supply.id}
                            size="sm"
                            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                            borderWidth="1px"
                            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        >
                            <CardBody py={2} px={3}>
                                <HStack justify="space-between" align="start" spacing={2}>
                                    <Box flex="1" minW={0}>
                                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1} color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                                            {supply.name}
                                        </Text>
                                        {supply.description && (
                                            <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} noOfLines={2} mt={0.5}>
                                                {supply.description}
                                            </Text>
                                        )}
                                        <HStack spacing={1} mt={1.5} flexWrap="wrap">
                                            <Badge size="sm" colorScheme={supply.available_quantity <= supply.minimum_quantity ? 'red' : 'green'}>
                                                {supply.available_quantity} {supply.unit?.symbol ?? ''}
                                            </Badge>
                                            {isManager && (
                                                <Badge size="sm" colorScheme="blue">
                                                    mín {supply.minimum_quantity}
                                                </Badge>
                                            )}
                                            <Badge size="sm" colorScheme="purple">
                                                {supply.category?.label ?? '—'}
                                            </Badge>
                                            {isManager && (
                                                <Badge size="sm" colorScheme={supply.visible_to_requesters ? 'green' : 'gray'}>
                                                    {supply.visible_to_requesters ? 'Visível' : 'Oculto'}
                                                </Badge>
                                            )}
                                        </HStack>
                                    </Box>
                                    {isManager && (
                                        <HStack spacing={0} flexShrink={0}>
                                            <IconButton
                                                aria-label="Editar"
                                                icon={<FiEdit2 />}
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => handleOpenEdit(supply)}
                                            />
                                            <IconButton
                                                aria-label="Excluir"
                                                icon={<FiTrash2 />}
                                                size="xs"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => onDelete(supply.id)}
                                            />
                                        </HStack>
                                    )}
                                </HStack>
                            </CardBody>
                        </Card>
                    ))}
                </VStack>
            </VStack>

            <Drawer isOpen={isFilterOpen} placement="bottom" onClose={onFilterClose}>
                <DrawerOverlay />
                <DrawerContent borderTopRadius="xl">
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth="1px">Filtros</DrawerHeader>
                    <DrawerBody py={4}>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Categoria</FormLabel>
                                <Select
                                    value={selectedCategory}
                                    onChange={(e) => onCategoryChange(e.target.value)}
                                    size="sm"
                                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                                    backdropFilter="blur(12px)"
                                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                                >
                                    <option value="">Todas as categorias</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            {isManager && (
                                <FormControl>
                                    <FormLabel>Visibilidade</FormLabel>
                                    <Select
                                        value={selectedVisibility}
                                        onChange={(e) => onVisibilityChange(e.target.value as SupplyVisibilityFilter)}
                                        size="sm"
                                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                                        backdropFilter="blur(12px)"
                                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                                    >
                                        <option value="">Todas</option>
                                        <option value="visible">Visível</option>
                                        <option value="hidden">Oculto</option>
                                    </Select>
                                </FormControl>
                            )}
                        </VStack>
                    </DrawerBody>
                    <DrawerFooter borderTopWidth="1px">
                        <Button
                            variant="outline"
                            size="sm"
                            w="full"
                            onClick={onClearFilters}
                            isDisabled={!filtersActive}
                        >
                            Limpar filtros
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {isManager && (
                <SupplyModal
                    isOpen={isOpen}
                    onClose={handleClose}
                    onSubmit={selectedSupply ? onEdit : onCreate}
                    categories={categories}
                    initialData={selectedSupply || undefined}
                />
            )}
        </Box>
    );
} 