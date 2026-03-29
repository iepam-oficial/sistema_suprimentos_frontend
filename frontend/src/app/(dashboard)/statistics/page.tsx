'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    SimpleGrid,
    Heading,
    VStack,
    useToast,
    Text,
    Select,
    HStack,
    useBreakpointValue,
    useColorMode,
    FormControl,
    FormLabel,
    Skeleton,
} from '@chakra-ui/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { MobileStatistics } from './components/MobileStatistics';

interface StatisticsData {
    serviceOrdersByMonth: { month: string; count: number }[];
    inventoryByType: { type: string; count: number }[];
    alertsByLevel: { level: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function getAlertColor(level: string): string {
    const l = (level ?? '').toLowerCase();
    if (l.includes('crítico') || l.includes('critico')) return '#DC2626';
    if (l.includes('alto')) return '#EA580C';
    if (l.includes('médio') || l.includes('medio')) return '#CA8A04';
    if (l.includes('baixo')) return '#16A34A';
    return '#8884D8';
}

function getKpis(data: StatisticsData) {
    const totalOrders = data.serviceOrdersByMonth.reduce((s, x) => s + x.count, 0);
    const totalInventory = data.inventoryByType.reduce((s, x) => s + x.count, 0);
    const totalAlerts = data.alertsByLevel.reduce((s, x) => s + x.count, 0);
    return { totalOrders, totalInventory, totalAlerts };
}

const cardBoxProps = (colorMode: string, isMobile: boolean) => ({
    shadow: 'base' as const,
    rounded: 'lg',
    bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(12px)',
    border: '1px solid',
    borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    p: isMobile ? 4 : 6,
    transition: 'all 0.3s ease',
    _hover: {
        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        transform: 'translateY(-2px)',
        shadow: 'lg',
    },
});

export default function StatisticsPage() {
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const router = useRouter();
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { colorMode } = useColorMode();

    useEffect(() => {
        const token = localStorage.getItem('@ti-assistant:token');
        const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');

        if (!token) {
            router.push('/login');
            return;
        }

        if (!['ADMIN', 'MANAGER'].includes(user.role)) {
            toast({
                title: 'Acesso Negado',
                description: 'Você não tem permissão para acessar esta página',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            router.push('/dashboard');
            return;
        }

        fetchStatistics();
    }, [router, toast, timeRange]);

    const fetchStatistics = async () => {
        try {
            const token = localStorage.getItem('@ti-assistant:token');

            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`/api/statistics?timeRange=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 429) {
                router.push('/rate-limit');
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao buscar estatísticas');
            }

            const statisticsData = await response.json();
            // Ordenar os dados para melhor visualização
            statisticsData.inventoryByType = [...statisticsData.inventoryByType].sort((a, b) => b.count - a.count);
            statisticsData.alertsByLevel = [...statisticsData.alertsByLevel].sort((a, b) => b.count - a.count);
            // Ordenar meses cronologicamente (assumindo meses abreviados em pt-BR)
            const monthOrder = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            statisticsData.serviceOrdersByMonth = [...statisticsData.serviceOrdersByMonth].sort((a, b) => {
                return monthOrder.indexOf(a.month.toLowerCase()) - monthOrder.indexOf(b.month.toLowerCase());
            });
            setData(statisticsData);
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as estatísticas',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box p={8}>
                <VStack spacing={6} align="stretch">
                    <HStack justify="space-between">
                        <Skeleton height="32px" width="180px" />
                        <Skeleton height="40px" width="200px" />
                    </HStack>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height="80px" rounded="lg" />
                        ))}
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height="300px" rounded="lg" />
                        ))}
                    </SimpleGrid>
                </VStack>
            </Box>
        );
    }

    if (!data) {
        return <Box p={8}>Erro ao carregar dados</Box>;
    }

    if (isMobile) {
        return (
            <MobileStatistics
                data={data}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
            />
        );
    }

    const kpis = getKpis(data);

    return (
        <Box p={isMobile ? 4 : 8}>
            <VStack spacing={isMobile ? 4 : 8} align="stretch">
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <Heading size={isMobile ? "md" : "lg"} color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                        Estatísticas
                    </Heading>
                    <FormControl width="auto" display="flex" alignItems="center" gap={2}>
                        <FormLabel mb={0} fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                            Período
                        </FormLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            width="200px"
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
                            <option value="7">Últimos 7 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Último ano</option>
                        </Select>
                    </FormControl>
                </HStack>

                {/* KPI cards */}
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                    <Box {...cardBoxProps(colorMode, isMobile ?? false)}>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} mb={1}>
                            Ordens (período)
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                            {kpis.totalOrders}
                        </Text>
                    </Box>
                    <Box {...cardBoxProps(colorMode, isMobile ?? false)}>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} mb={1}>
                            Inventário
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                            {kpis.totalInventory}
                        </Text>
                    </Box>
                    <Box {...cardBoxProps(colorMode, isMobile ?? false)}>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} mb={1}>
                            Alertas
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                            {kpis.totalAlerts}
                        </Text>
                    </Box>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    {/* Gráfico de Ordens de Serviço por Mês */}
                    <Box
                        shadow="base"
                        rounded="lg"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        border="1px solid"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        p={isMobile ? 4 : 6}
                        transition="all 0.3s ease"
                        _hover={{
                            bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                            transform: 'translateY(-2px)',
                            shadow: 'lg',
                            cursor: 'pointer'
                        }}
                    >
                        <Heading size={isMobile ? "sm" : "md"} mb={4} color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                            Ordens de Serviço por Mês
                        </Heading>
                        <Box height="300px">
                            {data.serviceOrdersByMonth.length === 0 ? (
                                <Box height="100%" display="flex" alignItems="center" justifyContent="center" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                                    Nenhuma ordem de serviço no período selecionado
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.serviceOrdersByMonth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colorMode === 'dark' ? 'gray.600' : 'gray.200'} />
                                    <XAxis
                                        dataKey="month"
                                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                    />
                                    <YAxis
                                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                        label={{
                                            value: 'Quantidade',
                                            angle: -90,
                                            position: 'insideLeft',
                                            style: { textAnchor: 'middle' }
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: colorMode === 'dark' ? 'gray.800' : 'white',
                                            border: `1px solid ${colorMode === 'dark' ? 'gray.700' : 'gray.200'}`,
                                            color: colorMode === 'dark' ? 'white' : 'gray.800'
                                        }}
                                        labelFormatter={(value) => value}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#8884d8"
                                        name="Quantidade"
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            )}
                        </Box>
                    </Box>

                    {/* Gráfico de Itens do Inventário por Tipo */}
                    <Box
                        p={isMobile ? 4 : 6}
                        shadow="base"
                        rounded="lg"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        border="1px solid"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        transition="all 0.3s ease"
                        _hover={{
                            bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                            transform: 'translateY(-2px)',
                            shadow: 'lg'
                        }}
                    >
                        <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" mb={4} color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                            Itens do Inventário por Tipo
                        </Text>
                        <Box height="300px">
                            {data.inventoryByType.length === 0 ? (
                                <Box height="100%" display="flex" alignItems="center" justifyContent="center" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                                    Nenhum item no inventário
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.inventoryByType}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colorMode === 'dark' ? 'gray.600' : 'gray.200'} />
                                    <XAxis
                                        dataKey="type"
                                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                    />
                                    <YAxis
                                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: colorMode === 'dark' ? 'gray.800' : 'white',
                                            border: `1px solid ${colorMode === 'dark' ? 'gray.700' : 'gray.200'}`,
                                            color: colorMode === 'dark' ? 'white' : 'gray.800'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#8884d8" name="Quantidade" />
                                </BarChart>
                            </ResponsiveContainer>
                            )}
                        </Box>
                    </Box>

                    {/* Gráfico de Alertas por Nível */}
                    <Box
                        p={isMobile ? 4 : 6}
                        shadow="base"
                        rounded="lg"
                        bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
                        backdropFilter="blur(12px)"
                        border="1px solid"
                        borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                        transition="all 0.3s ease"
                        _hover={{
                            bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                            transform: 'translateY(-2px)',
                            shadow: 'lg'
                        }}
                    >
                        <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" mb={4} color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                            Alertas por Nível
                        </Text>
                        <Box height="300px">
                            {data.alertsByLevel.length === 0 ? (
                                <Box height="100%" display="flex" alignItems="center" justifyContent="center" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                                    Nenhum alerta
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.alertsByLevel}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colorMode === 'dark' ? 'gray.600' : 'gray.200'} />
                                    <XAxis
                                        dataKey="level"
                                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                    />
                                    <YAxis
                                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: colorMode === 'dark' ? 'gray.800' : 'white',
                                            border: `1px solid ${colorMode === 'dark' ? 'gray.700' : 'gray.200'}`,
                                            color: colorMode === 'dark' ? 'white' : 'gray.800'
                                        }}
                                    />
                                    <Bar dataKey="count" name="Quantidade">
                                        {data.alertsByLevel.map((entry, index) => (
                                            <Cell key={`alert-${index}`} fill={getAlertColor(entry.level)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            )}
                        </Box>
                    </Box>
                </SimpleGrid>
            </VStack>
        </Box>
    );
} 