'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Heading,
    Card,
    CardBody,
    Text,
    useColorModeValue,
    VStack,
    HStack,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
} from '@chakra-ui/react';
import { FiPackage, FiMapPin, FiTag, FiLayers } from 'react-icons/fi';
import { PieChart } from '../components/PieChart';
import { formatBRL, sumMoney } from '@/utils/money';

interface InventoryItem {
    id: string;
    item: string;
    name: string;
    model: string;
    serial_number: string;
    finality: string;
    acquisition_price: number;
    acquisition_date: string;
    location: {
        name: string;
    };
    locale?: {
        id: string;
        name: string;
        description?: string;
    };
    category: {
        id: string;
        label: string;
    };
    subcategory: {
        id: string;
        label: string;
    };
}

export default function InventoryStatisticsPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    // Preparar dados para os gráficos
    const categoryData = items.reduce((acc, item) => {
        const cat = item.category?.label || 'Sem categoria';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const locationData = items.reduce((acc, item) => {
        const loc = item.location?.name || 'Sem localização';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token')
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar inventário');
        } finally {
            setLoading(false);
        }
    };

    // Estatísticas gerais
    const totalItems = items.length;
    const totalValue = sumMoney(items.map((item) => item.acquisition_price || 0));
    const uniqueLocations = new Set(items.map(item => item.location.name)).size;
    const uniqueCategories = new Set(items.map(item => item.category.label)).size;

    const colors = [
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 99, 132, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)'
    ];

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading size="lg">Estatísticas do Inventário</Heading>

                {/* Cards de estatísticas gerais */}
                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6}>
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Stat>
                                <HStack>
                                    <FiPackage size={24} />
                                    <StatLabel>Total de Itens</StatLabel>
                                </HStack>
                                <StatNumber>{totalItems}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Stat>
                                <HStack>
                                    <FiTag size={24} />
                                    <StatLabel>Valor Total</StatLabel>
                                </HStack>
                                <StatNumber>{formatBRL(totalValue)}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Stat>
                                <HStack>
                                    <FiMapPin size={24} />
                                    <StatLabel>Localizações</StatLabel>
                                </HStack>
                                <StatNumber>{uniqueLocations}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Stat>
                                <HStack>
                                    <FiLayers size={24} />
                                    <StatLabel>Categorias</StatLabel>
                                </HStack>
                                <StatNumber>{uniqueCategories}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                </Grid>

                {/* Gráficos */}
                <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Text fontSize="lg" mb={4}>Distribuição por Categoria</Text>
                            <Box height="300px">
                                <PieChart
                                    id="categoryChart"
                                    data={{
                                        labels: Object.keys(categoryData),
                                        datasets: [{
                                            data: Object.values(categoryData),
                                            backgroundColor: colors,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                            },
                                            title: {
                                                display: true,
                                                text: 'Distribuição por Categoria'
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </CardBody>
                    </Card>

                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Text fontSize="lg" mb={4}>Distribuição por Localização</Text>
                            <Box height="300px">
                                <PieChart
                                    id="locationChart"
                                    data={{
                                        labels: Object.keys(locationData),
                                        datasets: [{
                                            data: Object.values(locationData),
                                            backgroundColor: colors,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                            },
                                            title: {
                                                display: true,
                                                text: 'Distribuição por Localização'
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </CardBody>
                    </Card>
                </Grid>
            </VStack>
        </Container>
    );
} 