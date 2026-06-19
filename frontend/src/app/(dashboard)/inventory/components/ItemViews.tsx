import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    IconButton,
    Tooltip,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useColorMode,
    Flex,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { InventoryItem } from '../types';
import { getStatusColor, getStatusLabel } from '../utils/statusUtils';
import formatCurrency from '../utils/formatCurrency';

interface ItemViewsProps {
    items: InventoryItem[];
    onDelete: (id: string) => void;
    onEdit: (item: InventoryItem) => void;
}

export const MobileView = ({ items, onDelete, onEdit }: ItemViewsProps) => {
    const { colorMode } = useColorMode();

    return (
        <VStack spacing={3} align="stretch">
            {items.map(item => (
                <Box
                    key={item.id}
                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                    backdropFilter="blur(12px)"
                    border="1px solid"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    borderRadius="lg"
                    p={2}
                    position="relative"
                    transition="all 0.3s ease"
                    _hover={{
                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                    }}
                >
                    <Flex justify="space-between" align="center" mb={2}>
                        <HStack spacing={2}>
                            <HStack spacing={2} flexWrap="wrap" gap={1}>
                                <Badge colorScheme="blue" fontSize="xs">{item.item}</Badge>
                                <Badge colorScheme="purple" fontSize="xs">{item.category.label}</Badge>
                                <Badge colorScheme={getStatusColor(item.status)} fontSize="xs">
                                    {getStatusLabel(item.status)}
                                </Badge>
                            </HStack>
                        </HStack>
                        <HStack spacing={1}>
                            <Tooltip label="Editar">
                                <IconButton
                                    aria-label="Editar item"
                                    icon={<FiEdit2 size="14px" />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => onEdit(item)}
                                />
                            </Tooltip>
                            <Tooltip label="Excluir">
                                <IconButton
                                    aria-label="Excluir item"
                                    icon={<FiTrash2 size="14px" />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => onDelete(item.id)}
                                    _hover={{
                                        bg: colorMode === 'dark' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                                    }}
                                    transition="all 0.2s ease"
                                />
                            </Tooltip>
                        </HStack>
                    </Flex>

                    <VStack align="stretch" spacing={2}>
                        <Box>
                            <Text fontWeight="bold" fontSize="xs" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Nº Série</Text>
                            <Text fontSize="sm" fontFamily="mono" noOfLines={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>{item.serial_number}</Text>
                        </Box>

                        <HStack spacing={4}>
                            <Box flex={1}>
                                <Text fontWeight="bold" fontSize="xs" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Polo</Text>
                                <Text fontSize="sm" noOfLines={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>{item.location.name}</Text>
                            </Box>
                            <Box flex={1}>
                                <Text fontWeight="bold" fontSize="xs" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Ambiente</Text>
                                <Text fontSize="sm" noOfLines={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>{item.locale?.name || '-'}</Text>
                            </Box>
                        </HStack>

                        <Box>
                            <Text fontWeight="bold" fontSize="xs" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Preço de Aquisição</Text>
                            <Text fontSize="sm" noOfLines={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>{formatCurrency(item.acquisition_price)}</Text>
                        </Box>

                        <Box>
                            <Text fontWeight="bold" fontSize="xs" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Valor Depreciado</Text>
                            <Text fontSize="sm" noOfLines={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>{formatCurrency(item.depreciated_value)}</Text>
                        </Box>

                        <Box>
                            <Text fontWeight="bold" fontSize="xs" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Subcategoria</Text>
                            <Text fontSize="sm" noOfLines={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>{item.subcategory.label}</Text>
                        </Box>
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
};

export const DesktopView = ({ items, onDelete, onEdit }: ItemViewsProps) => {
    const { colorMode } = useColorMode();
    const thProps = {
        py: 2,
        color: colorMode === 'dark' ? 'gray.300' : 'gray.600',
        bg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
    };
    const tdTextProps = {
        py: 1.5,
        px: 2,
        fontSize: 'sm' as const,
        color: colorMode === 'dark' ? 'white' : 'gray.800',
    };

    return (
        <Box overflowX="auto">
            <Table size="sm" variant="simple">
                <Thead position="sticky" top={0} zIndex={1}>
                    <Tr>
                        <Th {...thProps}>Item</Th>
                        <Th {...thProps}>Número de Série</Th>
                        <Th {...thProps}>Status</Th>
                        <Th {...thProps}>Polo</Th>
                        <Th {...thProps}>Ambiente</Th>
                        <Th {...thProps}>Preço de Aquisição</Th>
                        <Th {...thProps}>Valor Depreciado</Th>
                        <Th {...thProps}>Categoria</Th>
                        <Th {...thProps}>Subcategoria</Th>
                        <Th {...thProps}>Ações</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {items.map((item) => (
                        <Tr
                            key={item.id}
                            _hover={{
                                bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'gray.50',
                            }}
                        >
                            <Td py={1.5} px={2}>
                                <Badge size="sm" colorScheme="blue">{item.item}</Badge>
                            </Td>
                            <Td py={1.5} px={2} fontSize="sm" maxW="140px" isTruncated>
                                <Text fontFamily="mono" color={colorMode === 'dark' ? 'white' : 'gray.800'} isTruncated>
                                    {item.serial_number}
                                </Text>
                            </Td>
                            <Td py={1.5} px={2}>
                                <Badge size="sm" colorScheme={getStatusColor(item.status)}>
                                    {getStatusLabel(item.status)}
                                </Badge>
                            </Td>
                            <Td {...tdTextProps} maxW="140px" isTruncated>{item.location.name}</Td>
                            <Td {...tdTextProps} maxW="140px" isTruncated>{item.locale?.name || '-'}</Td>
                            <Td {...tdTextProps}>{formatCurrency(item.acquisition_price)}</Td>
                            <Td {...tdTextProps}>{item.residual_value === 0 ? '-' : formatCurrency(item.depreciated_value)}</Td>
                            <Td {...tdTextProps} maxW="140px" isTruncated>{item.category.label}</Td>
                            <Td {...tdTextProps} maxW="140px" isTruncated>{item.subcategory.label}</Td>
                            <Td py={1} px={2}>
                                <HStack spacing={0}>
                                    <Tooltip label="Editar">
                                        <IconButton
                                            aria-label="Editar item"
                                            icon={<FiEdit2 />}
                                            size="sm"
                                            variant="ghost"
                                            colorScheme="blue"
                                            onClick={() => onEdit(item)}
                                        />
                                    </Tooltip>
                                    <Tooltip label="Excluir">
                                        <IconButton
                                            aria-label="Excluir item"
                                            icon={<FiTrash2 />}
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => onDelete(item.id)}
                                        />
                                    </Tooltip>
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};
