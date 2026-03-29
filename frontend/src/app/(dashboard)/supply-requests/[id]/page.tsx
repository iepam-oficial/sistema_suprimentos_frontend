'use client';

import {
    Box,
    Container,
    Heading,
    Text,
    Image,
    Badge,
    Flex,
    Spinner,
    VStack,
    HStack,
    Button,
    useColorModeValue,
    Divider,
    IconButton,
    useBreakpointValue,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    Card,
    CardBody,
    Grid,
    GridItem,
    useMediaQuery,
    Icon,
} from '@chakra-ui/react';
import { ArrowLeft, ShoppingCart, Package, DollarSign, Tag, Hash, Calendar, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { DeliveryDetailsModal } from '../components/DeliveryDetailsModal';
import { formatBRL } from '@/utils/money';

interface Supply {
    id: string;
    name: string;
    description: string;
    category: {
        id: string;
        value: string;
        label: string;
    };
    subcategory?: {
        id: string;
        value: string;
        label: string;
    };
    minimum_quantity: number;
    current_quantity: number;
    quantity: number;
    unit_price?: number;
    unit?: string | {
        id: string;
        name: string;
        symbol: string;
        description?: string;
    };
    supplier?: string | {
        id: string;
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        cnpj?: string;
        contact_person?: string;
    };
    freight?: number;
    image_url?: string;
}

interface SupplyRequest {
    id: string;
    supply: {
        id: string;
        name: string;
        description: string;
        quantity: number;
        unit: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    quantity: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
    notes: string;
    created_at: string;
    requester_confirmation: boolean;
    manager_delivery_confirmation: boolean;
    delivery_deadline: string;
    destination: string;
    is_custom: boolean;
}

export default function SupplyDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [supply, setSupply] = useState<Supply | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [deliveryDeadline, setDeliveryDeadline] = useState('');
    const [destination, setDestination] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isMobile] = useMediaQuery('(max-width: 768px)');
    // Cores
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const headingColor = useColorModeValue('gray.800', 'white');
    const subHeadingColor = useColorModeValue('gray.600', 'gray.300');
    const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');
    const [request, setRequest] = useState<SupplyRequest | null>(null);
    const [user, setUser] = useState({ role: '' });
    const [userLocales, setUserLocales] = useState<any[]>([]);
    const [localeId, setLocaleId] = useState('');

    const fetchSupply = useCallback(async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`/api/supplies/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (response.status === 429) {
                router.push('/rate-limit');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao carregar detalhes do suprimento');
            }
            const data = await response.json();
            setSupply(data);
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Não foi possível carregar os detalhes do suprimento',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            router.push('/supply-requests');
        } finally {
            setLoading(false);
        }
    }, [params.id, router, toast]);

    useEffect(() => {
        fetchSupply();
        // Buscar locais da filial do usuário
        const fetchUserLocales = async () => {
            try {
                const token = localStorage.getItem('@ti-assistant:token');
                if (!token) return;
                const response = await fetch('/api/locales/user-location', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserLocales(data);
                }
            } catch (e) {
                // Silenciar erro
            }
        };
        fetchUserLocales();
    }, [fetchSupply]);

    const handleQuantityChange = (value: string) => {
        if (!supply) return;
        const numValue = parseInt(value);
        if (numValue > supply.quantity) {
            setQuantity(supply.quantity);
        } else if (numValue < 1) {
            setQuantity(1);
        } else {
            setQuantity(numValue);
        }
    };

    const addToCart = (supply: Supply, quantity: number) => {
        const cart = JSON.parse(localStorage.getItem('@ti-assistant:cart') || '[]');
        const existingItem = cart.find((item: any) => item.supply.id === supply.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ supply, quantity });
        }

        localStorage.setItem('@ti-assistant:cart', JSON.stringify(cart));

        toast({
            title: 'Item adicionado',
            description: `${supply.name} foi adicionado ao carrinho`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const handleOrderSubmit = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const requestBody = {
                supply_id: supply?.id,
                quantity,
                delivery_deadline: deliveryDeadline,
                destination,
                locale_id: localeId,
                notes: `Pedido direto de ${supply?.name}`
            };

            const response = await fetch('/api/supply-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao realizar pedido');
            }

            toast({
                title: 'Sucesso',
                description: 'Pedido realizado com sucesso!',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onClose();
            router.push('/supply-requests');
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao realizar pedido',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRequesterConfirmation = async (confirmation: boolean) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch(`/api/supply-requests/${params.id}/requester-confirmation`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirmation })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar confirmação');
            }

            toast({
                title: 'Sucesso',
                description: 'Confirmação atualizada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            const updatedResponse = await fetch(`/api/supply-requests/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await updatedResponse.json();
            setRequest(data);
            setUser(data.user);
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao atualizar confirmação',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleManagerDeliveryConfirmation = async (confirmation: boolean) => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            if (request?.requester_confirmation && confirmation) {
                setRequest(prev => prev ? {
                    ...prev,
                    manager_delivery_confirmation: true
                } : null);

                toast({
                    title: 'Sucesso',
                    description: 'Confirmação atualizada com sucesso',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }

            const endpoint = request?.is_custom
                ? `/api/custom-supply-requests/${params.id}/manager-delivery-confirmation`
                : `/api/supply-requests/${params.id}/manager-delivery-confirmation`;

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirmation })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar confirmação');
            }

            toast({
                title: 'Sucesso',
                description: 'Confirmação atualizada com sucesso',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            fetchSupply();
        } catch (error) {
            toast({
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao atualizar confirmação',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const loadingBg = useColorModeValue('gray.50', 'gray.900');
    const mainBg = useColorModeValue('gray.50', 'gray.900');

    if (loading) {
        return (
            <Box minH="100vh" bg={loadingBg} py={6}>
                <Container maxW="container.xl">
                    <Flex justify="center" align="center" minH="400px">
                        <VStack spacing={4}>
                            <Spinner size="xl" color="blue.500" thickness="4px" />
                            <Text color="gray.500">Carregando detalhes do suprimento...</Text>
                        </VStack>
                </Flex>
                </Container>
            </Box>
        );
    }

    if (!supply) {
        return null;
    }

    return (
        <Box minH="100vh" bg={mainBg} py={isMobile ? "7vh" : 6}>
            <Container maxW="container.xl">
                <VStack spacing={6} align="stretch">
                    {/* Header */}
                    <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                    <IconButton
                        aria-label="Voltar"
                                icon={<ArrowLeft size={24} />}
                        variant="ghost"
                        onClick={() => router.back()}
                                size="lg"
                                _hover={{ bg: buttonHoverBg }}
                    />
                            <VStack align="start" spacing={1}>
                                <Heading size="lg" color={headingColor}>
                                    Detalhes do Suprimento
                                </Heading>
                                <Text color="gray.500" fontSize="sm">
                                    Informações completas do item
                                </Text>
                            </VStack>
                </HStack>
                    </Flex>

                    {/* Main Content */}
                    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
                        {/* Image Section */}
                        <GridItem>
                            <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} overflow="hidden">
                                <CardBody p={0}>
                        <Image
                            src={supply.image_url || '/placeholder.png'}
                            alt={supply.name}
                                        width="100%"
                            height="500px"
                                        objectFit="contain"
                                        fallbackSrc="/placeholder.png"
                        />
                                </CardBody>
                            </Card>
                        </GridItem>

                        {/* Details Section */}
                        <GridItem>
                            <VStack spacing={6} align="stretch">
                                {/* Title and Status */}
                                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Heading size="lg" color={headingColor}>
                                                {supply.name}
                                            </Heading>
                                            <Text color={subHeadingColor} fontSize="md" lineHeight="1.6">
                                                {supply.description}
                                            </Text>
                        <HStack spacing={3}>
                                                <Badge 
                                                    colorScheme="blue" 
                                                    size="lg"
                                                    px={4}
                                                    py={2}
                                                    borderRadius="full"
                                                >
                                {supply.category.label}
                            </Badge>
                            {supply.subcategory && (
                                                    <Badge 
                                                        colorScheme="green" 
                                                        size="lg"
                                                        px={4}
                                                        py={2}
                                                        borderRadius="full"
                                                    >
                                    {supply.subcategory.label}
                                </Badge>
                            )}
                                                <Badge 
                                                    colorScheme={supply.quantity > 0 ? 'green' : 'red'} 
                                                    size="lg"
                                                    px={4}
                                                    py={2}
                                                    borderRadius="full"
                                                >
                                                    {supply.quantity > 0 ? 'Disponível' : 'Indisponível'}
                                                </Badge>
                                            </HStack>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Product Details */}
                                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Heading size="md" color={headingColor}>
                                                Informações do Produto
                                            </Heading>
                                            <Grid templateColumns="1fr 1fr" gap={4}>
                                                <VStack align="start" spacing={2}>
                                                    <HStack>
                                                        <Package size={16} color="gray.500" />
                                                        <Text fontSize="sm" color="gray.500">Quantidade Disponível</Text>
                                                    </HStack>
                                                    <Text fontWeight="bold" fontSize="lg">
                                                        {supply.quantity} {typeof supply.unit === 'string' ? supply.unit : supply.unit?.symbol || 'un'}
                                                    </Text>
                                                </VStack>
                                                <VStack align="start" spacing={2}>
                                                    <HStack>
                                                        <Tag size={16} color="gray.500" />
                                                        <Text fontSize="sm" color="gray.500">Quantidade Mínima</Text>
                                                    </HStack>
                                                    <Text fontWeight="medium">
                                                        {supply.minimum_quantity} {typeof supply.unit === 'string' ? supply.unit : supply.unit?.symbol || 'un'}
                                                    </Text>
                                                </VStack>
                                                {supply.unit_price && (
                                                    <VStack align="start" spacing={2}>
                                                        <HStack>
                                                            <DollarSign size={16} color="gray.500" />
                                                            <Text fontSize="sm" color="gray.500">Preço Unitário</Text>
                                                        </HStack>
                                                        <Text fontWeight="bold" color="green.600" fontSize="lg">
                                                            {formatBRL(supply.unit_price)}
                                                        </Text>
                                                    </VStack>
                                                )}
                                                {supply.supplier && (
                                                    <VStack align="start" spacing={2}>
                                                        <HStack>
                                                            <Building size={16} color="gray.500" />
                                                            <Text fontSize="sm" color="gray.500">Fornecedor</Text>
                        </HStack>
                                                        <VStack align="start" spacing={1}>
                                                            <Text fontWeight="medium">
                                                                {typeof supply.supplier === 'string' 
                                                                    ? supply.supplier 
                                                                    : supply.supplier.name || 'N/A'
                                                                }
                                                            </Text>
                                                            {typeof supply.supplier === 'object' && supply.supplier.contact_person && (
                                                                <Text fontSize="xs" color="gray.500">
                                                                    Contato: {supply.supplier.contact_person}
                                                                </Text>
                                                            )}
                                                        </VStack>
                                                    </VStack>
                                                )}
                                            </Grid>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Order Section */}
                                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            <Heading size="md" color={headingColor}>
                                                Fazer Pedido
                                            </Heading>
                                            
                                            <VStack spacing={3} align="stretch">
                            <HStack justify="space-between" align="center">
                                                    <Text fontSize="sm" color="gray.500">Quantidade Desejada:</Text>
                                                    <Text fontSize="sm" color="gray.500">Máx: {supply.quantity}</Text>
                            </HStack>
                                <NumberInput
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    min={1}
                                    max={supply.quantity}
                                    size="lg"
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                        </VStack>

                                            {/* Action Buttons */}
                                            <VStack spacing={3}>
                            <Button
                                colorScheme="blue"
                                                    leftIcon={<ShoppingCart size={20} />} 
                                onClick={() => addToCart(supply, quantity)}
                                isDisabled={supply.quantity <= 0}
                                size="lg"
                                                    height="50px"
                                                    fontWeight="semibold"
                                                    w="full"
                                                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                                                    transition="all 0.2s ease"
                            >
                                Adicionar ao Carrinho
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={onOpen}
                                isDisabled={supply.quantity <= 0}
                                size="lg"
                                                    height="50px"
                                                    fontWeight="semibold"
                                                    w="full"
                                                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                                                    transition="all 0.2s ease"
                            >
                                                    Realizar Pedido Direto
                            </Button>
                                            </VStack>
                                        </VStack>
                                    </CardBody>
                                </Card>
                    </VStack>
                        </GridItem>
                    </Grid>

                <DeliveryDetailsModal
                    isOpen={isOpen}
                    onClose={onClose}
                    deliveryDeadline={deliveryDeadline}
                    setDeliveryDeadline={setDeliveryDeadline}
                    destination={destination}
                    setDestination={setDestination}
                    userLocales={userLocales}
                    onSubmit={handleOrderSubmit}
                    localeId={localeId}
                    setLocaleId={setLocaleId}
                />
            </VStack>
        </Container>
        </Box>
    );
} 