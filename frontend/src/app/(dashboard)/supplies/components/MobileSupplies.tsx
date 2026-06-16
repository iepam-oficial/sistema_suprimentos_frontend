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
    FormControl,
    FormLabel,
    IconButton,
    Text,
    Badge,
    Card,
    CardBody,
    Divider,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { Supply } from '../utils/types';
import { SupplyModal } from '../components/SupplyModal';
import { useState } from 'react';

interface MobileSuppliesProps {
    supplies: Supply[];
    categories: { id: string; label: string }[];
    onSearch: (term: string) => void;
    onCategoryChange: (category: string) => void;
    onDelete: (id: string) => void;
    onCreate: (data: any) => void;
    onEdit: (data: any) => void;
}

export function MobileSupplies({
    supplies,
    categories,
    onSearch,
    onCategoryChange,
    onDelete,
    onCreate,
    onEdit,
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
        <Box w="full" h="full" py="6vh">
            <VStack
                spacing={4}
                align="stretch"
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                backdropFilter="blur(12px)"
                p={3}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                h="full"
            >
                <VStack spacing={3} align="stretch">
                    <InputGroup size="sm">
                        <InputLeftElement pointerEvents="none">
                            <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                        </InputLeftElement>
                        <Input
                            placeholder="Buscar suprimentos..."
                            onChange={(e) => onSearch(e.target.value)}
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

                    <Button
                        leftIcon={<FiFilter />}
                        size="sm"
                        variant="outline"
                        onClick={onFilterOpen}
                        w="100%"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        _hover={{
                            bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                            transform: 'translateY(-1px)',
                        }}
                        transition="all 0.3s ease"
                    >
                        Filtros
                    </Button>
                </VStack>

                <VStack spacing={3} align="stretch">
                    <Button
                        leftIcon={<FiPlus />}
                        colorScheme="blue"
                        onClick={onOpen}
                        size="sm"
                        w="100%"
                        bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined}
                        _hover={{
                            bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined,
                            transform: 'translateY(-1px)',
                        }}
                        transition="all 0.3s ease"
                    >
                        Novo Suprimento
                    </Button>
                    <Button
                        leftIcon={<FiAlertTriangle />}
                        colorScheme="orange"
                        size="sm"
                        w="100%"
                        bg={colorMode === 'dark' ? 'rgba(237, 137, 54, 0.8)' : undefined}
                        _hover={{
                            bg: colorMode === 'dark' ? 'rgba(237, 137, 54, 0.9)' : undefined,
                            transform: 'translateY(-1px)',
                        }}
                        transition="all 0.3s ease"
                    >
                        Abaixo do Mínimo
                    </Button>
                </VStack>

                <Divider />

                <VStack spacing={4} align="stretch" overflowY="auto" flex="1">
                    {supplies.map((supply) => (
                        <Card
                            key={supply.id}
                            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                            backdropFilter="blur(12px)"
                            borderWidth="1px"
                            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                            _hover={{
                                transform: 'translateY(-2px)',
                                boxShadow: 'lg',
                            }}
                            transition="all 0.3s ease"
                        >
                            <CardBody>
                                <VStack align="stretch" spacing={3}>
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                                            {supply.name}
                                        </Text>
                                        <HStack spacing={2}>
                                            <IconButton
                                                aria-label="Editar"
                                                icon={<FiEdit2 />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleOpenEdit(supply)}
                                                _hover={{
                                                    bg: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                                }}
                                            />
                                            <IconButton
                                                aria-label="Excluir"
                                                icon={<FiTrash2 />}
                                                size="sm"
                                                variant="ghost"
                                                colorScheme="red"
                                                onClick={() => onDelete(supply.id)}
                                                _hover={{
                                                    bg: colorMode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                                                }}
                                            />
                                        </HStack>
                                    </HStack>
                                    <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                                        {supply.description}
                                    </Text>
                                    <HStack spacing={4} wrap="wrap">
                                        <Badge colorScheme={supply.quantity <= supply.minimum_quantity ? 'red' : 'green'}>
                                            Qtd: {supply.quantity} {supply.unit?.symbol ?? ''}
                                        </Badge>
                                        <Badge colorScheme="blue">
                                            Mín: {supply.minimum_quantity} {supply.unit?.symbol ?? ''}
                                        </Badge>
                                        <Badge colorScheme="purple">
                                            {supply.category?.label ?? '—'}
                                        </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                                        Fornecedor: {supply.supplier?.name ?? '—'}
                                    </Text>
                                </VStack>
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
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <SupplyModal
                isOpen={isOpen}
                onClose={handleClose}
                onSubmit={selectedSupply ? onEdit : onCreate}
                categories={categories}
                initialData={selectedSupply || undefined}
            />
        </Box>
    );
} 