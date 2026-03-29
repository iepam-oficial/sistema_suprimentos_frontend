import {
    Box,
    Container,
    Flex,
    Heading,
    Text,
    Select,
    VStack,
    useColorModeValue,
    Card,
    CardBody,
    SimpleGrid,
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

interface StatisticsData {
    serviceOrdersByMonth: { month: string; count: number }[];
    inventoryByType: { type: string; count: number }[];
    alertsByLevel: { level: string; count: number }[];
}

interface MobileStatisticsProps {
    data: StatisticsData;
    timeRange: string;
    onTimeRangeChange: (value: string) => void;
}

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

export function MobileStatistics({ data, timeRange, onTimeRangeChange }: MobileStatisticsProps) {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const kpis = getKpis(data);
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.5)', 'rgba(45, 55, 72, 0.5)');
    const cardBorder = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');
    const labelColor = useColorModeValue('gray.500', 'gray.400');
    const valueColor = useColorModeValue('gray.800', 'white');
    const isDark = useColorModeValue(false, true);
    const tooltipStyle = {
        backgroundColor: isDark ? '#1a202c' : 'white',
        border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
        color: isDark ? 'white' : '#1a202c',
    };

    return (
        <Container maxW="container.xl" py={4}>
            <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center" mt={4} marginTop="4vh">
                    <Heading size="md">Estatísticas</Heading>
                    <Select
                        value={timeRange}
                        onChange={(e) => onTimeRangeChange(e.target.value)}
                        width="150px"
                        size="sm"
                    >
                        <option value="7">7 dias</option>
                        <option value="30">30 dias</option>
                        <option value="90">90 dias</option>
                        <option value="365">1 ano</option>
                    </Select>
                </Flex>

                {/* KPI cards */}
                <SimpleGrid columns={2} spacing={3}>
                    <Box p={4} rounded="lg" bg={cardBg} border="1px solid" borderColor={cardBorder} backdropFilter="blur(12px)">
                        <Text fontSize="xs" color={labelColor} mb={1}>Ordens</Text>
                        <Text fontSize="xl" fontWeight="bold" color={valueColor}>{kpis.totalOrders}</Text>
                    </Box>
                    <Box p={4} rounded="lg" bg={cardBg} border="1px solid" borderColor={cardBorder} backdropFilter="blur(12px)">
                        <Text fontSize="xs" color={labelColor} mb={1}>Inventário</Text>
                        <Text fontSize="xl" fontWeight="bold" color={valueColor}>{kpis.totalInventory}</Text>
                    </Box>
                    <Box p={4} rounded="lg" bg={cardBg} border="1px solid" borderColor={cardBorder} backdropFilter="blur(12px)">
                        <Text fontSize="xs" color={labelColor} mb={1}>Alertas</Text>
                        <Text fontSize="xl" fontWeight="bold" color={valueColor}>{kpis.totalAlerts}</Text>
                    </Box>
                </SimpleGrid>

                {/* Gráfico de Ordens de Serviço por Mês */}
                <Card variant="outline">
                    <CardBody>
                        <Text fontSize="md" fontWeight="bold" mb={4}>
                            Ordens de Serviço por Mês
                        </Text>
                        <Box height="250px">
                            {data.serviceOrdersByMonth.length === 0 ? (
                                <Box height="100%" display="flex" alignItems="center" justifyContent="center" color={labelColor}>
                                    Nenhuma ordem no período
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.serviceOrdersByMonth}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#8884d8"
                                            name="Quantidade"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    </CardBody>
                </Card>

                {/* Gráfico de Itens do Inventário por Tipo */}
                <Card variant="outline">
                    <CardBody>
                        <Text fontSize="md" fontWeight="bold" mb={4}>
                            Itens do Inventário por Tipo
                        </Text>
                        <Box height="250px">
                            {data.inventoryByType.length === 0 ? (
                                <Box height="100%" display="flex" alignItems="center" justifyContent="center" color={labelColor}>
                                    Nenhum item no inventário
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.inventoryByType}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="type" />
                                        <YAxis />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend />
                                        <Bar dataKey="count" fill="#8884d8" name="Quantidade" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    </CardBody>
                </Card>

                {/* Gráfico de Alertas por Nível */}
                <Card variant="outline">
                    <CardBody>
                        <Text fontSize="md" fontWeight="bold" mb={4}>
                            Alertas por Nível
                        </Text>
                        <Box height="250px">
                            {data.alertsByLevel.length === 0 ? (
                                <Box height="100%" display="flex" alignItems="center" justifyContent="center" color={labelColor}>
                                    Nenhum alerta
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.alertsByLevel}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="level" />
                                        <YAxis />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend />
                                        <Bar dataKey="count" name="Quantidade">
                                            {data.alertsByLevel.map((entry, index) => (
                                                <Cell key={`alert-${index}`} fill={getAlertColor(entry.level)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Box>
                    </CardBody>
                </Card>
            </VStack>
        </Container>
    );
} 