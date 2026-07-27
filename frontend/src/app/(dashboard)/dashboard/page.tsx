'use client';

import { useEffect, useState } from 'react'
import {
  Box,
  SimpleGrid,
  Stat,
  StatNumber,
  StatHelpText,
  StatArrow,
  useToast,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  useBreakpointValue,
  useColorMode,
  Spinner,
  useColorModeValue,
  Card,
  CardBody,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  ShoppingCart,
  Clock,
  DollarSign,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBRL } from '@/utils/money'
import type { AlertDTO } from '@/features/alerts/types'
import { getDangerLevelColor, getDangerLevelLabel } from '@/features/alerts/lib/dangerLevel'

interface DashboardStats {
  totalServiceOrders: number
  totalServiceOrdersValue: number
  openServiceOrders: number
  criticalAlerts: number
  consumptionTrends: { date: string; quantity: number }[]
  averageDeliveryTimeTrends: { date: string; averageDays: number }[]
  totalSuppliers: number
  totalSupplyRequests: number
  pendingSupplyRequests: number
  approvedOrdersMonthlyInventoryValue: number
  approvedOrdersMonthlySuppliesValue: number
  approvedOrdersMonthlyTotalValue: number
}

interface ServiceOrder {
  id: string
  order_number: string
  client_name: string
  equipment_description: string
  problem_reported: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAlerts, setRecentAlerts] = useState<AlertDTO[]>([])
  const [recentServiceOrders, setRecentServiceOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const toast = useToast()
  const { colorMode } = useColorMode()

  const chartHeight = useBreakpointValue({ base: '200px', md: '240px', lg: '260px' }) ?? '240px'

  // Cores responsivas
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, pink.50)',
    'linear(to-br, gray.900, blue.900, purple.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('yellow.500', 'yellow.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token')
    if (!token) {
      router.push('/')
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('@ti-assistant:token')
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 429) {
        router.push('/rate-limit')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erro ao carregar dados do dashboard')
      }

      const data = await response.json()
      setStats(data.stats)
      setRecentAlerts(data.recentAlerts)
      setRecentServiceOrders(data.recentServiceOrders)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} display="flex" justifyContent="center" alignItems="center">
        <VStack spacing={4}>
          <Spinner size="xl" color={iconColor} thickness="4px" />
          <Text color={textSecondary} fontSize="lg">Carregando dashboard...</Text>
        </VStack>
      </Box>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <>
      <VStack
        spacing={{ base: 3, md: 4 }}
        align="stretch"
        bgGradient={bgGradient}
        minH="0"
        py={{ base: 2, md: 3 }}
        px={{ base: 3, md: 4, lg: 5 }}
      >
        {/* Cabeçalho compacto */}
        <Box pb={2} borderBottomWidth="1px" borderColor={cardBorder}>
          <Heading size="md" color={textColor} fontWeight="bold" lineHeight="shorter">
            Dashboard
          </Heading>
          <Text color={textSecondary} fontSize="sm" noOfLines={1}>
            Visão geral do sistema de gestão
          </Text>
        </Box>

        {/* Grupo 1: Operações */}
        <Box>
          <Heading size="sm" mb={2} color={textColor} fontWeight="bold" letterSpacing="tight">
            Operações
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push('/orders')}
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={2}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, orange.500, red.500)" color="white">
                    <Wrench size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Ordens de Serviço</Text>
                    <Text fontSize="xs" color={textSecondary}>Gestão de serviços</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>{stats.totalServiceOrders}</StatNumber>
                  <StatHelpText fontSize="sm" color={textSecondary}>
                    <StatArrow type={stats.openServiceOrders > 0 ? 'increase' : 'decrease'} />
                    {stats.openServiceOrders} em aberto
                  </StatHelpText>
                  <StatHelpText fontSize="sm" color={textSecondary} mt={1}>
                    Valor Total: {formatBRL(stats.totalServiceOrdersValue)}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push('/supply-requests/admin')}
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={3}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, emerald.500, green.600)" color="white">
                    <DollarSign size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Pedidos Aprovados no Mês</Text>
                    <Text fontSize="xs" color={textSecondary}>Soma em reais das aprovações do mês atual</Text>
                  </VStack>
                </HStack>
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                  <Stat>
                    <Text fontSize="xs" color={textSecondary} mb={1}>Inventário</Text>
                    <StatNumber fontSize="xl" fontWeight="bold" color={textColor}>
                      {formatBRL(stats.approvedOrdersMonthlyInventoryValue)}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <Text fontSize="xs" color={textSecondary} mb={1}>Suprimentos</Text>
                    <StatNumber fontSize="xl" fontWeight="bold" color={textColor}>
                      {formatBRL(stats.approvedOrdersMonthlySuppliesValue)}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <Text fontSize="xs" color={textSecondary} mb={1}>Valor Total</Text>
                    <StatNumber fontSize="xl" fontWeight="bold" color={successColor}>
                      {formatBRL(stats.approvedOrdersMonthlyTotalValue)}
                    </StatNumber>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Grupo 2: Suprimentos */}
        <Box>
          <Heading size="sm" mb={2} color={textColor} fontWeight="bold" letterSpacing="tight">
            Suprimentos
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push('/suppliers')}
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={2}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, cyan.500)" color="white">
                    <Users size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Fornecedores</Text>
                    <Text fontSize="xs" color={textSecondary}>Parceiros comerciais</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>{stats.totalSuppliers}</StatNumber>
                  <StatHelpText fontSize="sm" color={textSecondary}>
                    <StatArrow type="increase" />
                    Total de fornecedores
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push('/supply-requests/admin')}
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={2}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, teal.500, green.500)" color="white">
                    <ShoppingCart size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Requisições</Text>
                    <Text fontSize="xs" color={textSecondary}>Pedidos de suprimentos</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>{stats.totalSupplyRequests}</StatNumber>
                  <StatHelpText fontSize="sm" color={textSecondary}>
                    <StatArrow type={stats.pendingSupplyRequests > 0 ? 'increase' : 'decrease'} />
                    {stats.pendingSupplyRequests} pendentes
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Grupo 3: Monitoramento */}
        <Box>
          <Heading size="sm" mb={2} color={textColor} fontWeight="bold" letterSpacing="tight">
            Monitoramento
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2, '2xl': 3 }} spacing={3}>
            {/* Gráfico de Linha - Tendências de Consumo */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() =>
                router.push('/reports?report=executive-summary&timeRange=365#consumption-trends')
              }
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={2}>
                  <Box p={1.5} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white">
                    <TrendingUp size={18} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Tendências de Consumo</Text>
                    <Text fontSize="xs" color={textSecondary}>Análise de dados</Text>
                  </VStack>
                </HStack>
                <Box h={chartHeight} minH={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.consumptionTrends}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colorMode === 'dark' ? 'gray.600' : 'gray.200'} />
                      <XAxis
                        dataKey="date"
                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          return `${month}/${year}`;
                        }}
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
                        labelFormatter={(value) => {
                          const [year, month] = value.split('-');
                          return `${month}/${year}`;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="quantity"
                        name="Consumo"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>

            {/* Gráfico de Linha - Tempo Médio de Entrega */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push('/supply-requests/admin')}
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={2}>
                  <Box p={1.5} borderRadius="full" bgGradient="linear(to-r, teal.500, cyan.500)" color="white">
                    <Clock size={18} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Tempo Médio de Entrega</Text>
                    <Text fontSize="xs" color={textSecondary}>Dias (requisições entregues)</Text>
                  </VStack>
                </HStack>
                <Box h={chartHeight} minH={chartHeight}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.averageDeliveryTimeTrends ?? []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colorMode === 'dark' ? 'gray.600' : 'gray.200'} />
                      <XAxis
                        dataKey="date"
                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          return `${month}/${year}`;
                        }}
                      />
                      <YAxis
                        stroke={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        label={{
                          value: 'Dias',
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
                        labelFormatter={(value) => {
                          const [year, month] = value.split('-');
                          return `${month}/${year}`;
                        }}
                        formatter={(value: number) => [`${value} dias`, 'Média']}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageDays"
                        name="Média (dias)"
                        stroke="#0d9488"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardBody>
            </Card>

            {/* Alertas Recentes */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => router.push('/alerts')}
            >
              <CardBody p={4}>
                <HStack spacing={2} mb={2}>
                  <Box p={1.5} borderRadius="full" bgGradient="linear(to-r, red.500, orange.500)" color="white">
                    <AlertTriangle size={18} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>Alertas Recentes</Text>
                    <Text fontSize="xs" color={textSecondary}>Notificações importantes</Text>
                  </VStack>
                </HStack>
                <VStack
                  align="stretch"
                  spacing={2}
                  maxH={{ base: '220px', md: 'min(40vh, 280px)' }}
                  overflowY="auto"
                  pr={1}
                  sx={{
                    scrollbarGutter: 'stable',
                  }}
                >
                  {recentAlerts.map((alert) => (
                    <Box
                      key={alert.id}
                      p={3}
                      borderWidth={1}
                      rounded="lg"
                      bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)'}
                      backdropFilter="blur(8px)"
                      borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                      transition="all 0.3s ease"
                      _hover={{
                        bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                        transform: 'translateY(-1px)',
                        shadow: 'md'
                      }}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{alert.about}</Text>
                        <Badge
                          colorScheme={getDangerLevelColor(alert.danger_level)}
                          fontSize="xs"
                          variant="solid"
                        >
                          {getDangerLevelLabel(alert.danger_level)}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color={textSecondary} mb={1}>{alert.description}</Text>
                      <Text fontSize="xs" color={textSecondary}>
                        {new Date(alert.created_at).toLocaleDateString()}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Grupo 4: Atividades Recentes */}
        <Box pb={2}>
          <Heading size="sm" mb={2} color={textColor} fontWeight="bold" letterSpacing="tight">
            Atividades Recentes
          </Heading>
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            shadow="md"
            _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => router.push('/orders')}
          >
            <CardBody p={4}>
              <HStack spacing={2} mb={2}>
                <Box p={1.5} borderRadius="full" bgGradient="linear(to-r, blue.500, cyan.500)" color="white">
                  <FileText size={18} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>Ordens de Serviço Recentes</Text>
                  <Text fontSize="xs" color={textSecondary}>Últimas atividades</Text>
                </VStack>
              </HStack>
              <VStack
                align="stretch"
                spacing={2}
                maxH={{ base: '240px', md: 'min(45vh, 360px)' }}
                overflowY="auto"
                pr={1}
                sx={{ scrollbarGutter: 'stable' }}
              >
                {recentServiceOrders.map((order) => (
                  <Box
                    key={order.id}
                    p={3}
                    borderWidth={1}
                    rounded="lg"
                    bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(255, 255, 255, 0.3)'}
                    backdropFilter="blur(8px)"
                    borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    transition="all 0.3s ease"
                    _hover={{
                      bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                      transform: 'translateY(-1px)',
                      shadow: 'md'
                    }}
                  >
                    <HStack justify="space-between" mb={1}>
                      <Text fontWeight="bold" fontSize="sm" color={textColor}>{order.order_number}</Text>
                      <Badge
                        colorScheme={
                          order.status === 'ABERTO' ? 'red' :
                            order.status === 'EM_ANDAMENTO' ? 'orange' : 'green'
                        }
                        fontSize="xs"
                        variant="solid"
                      >
                        {order.status}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color={textSecondary} mb={1}>{order.equipment_description}</Text>
                    <Text fontSize="xs" color={textSecondary} mb={1}>
                      Cliente: {order.client_name}
                    </Text>
                    <Text fontSize="xs" color={textSecondary} mb={1}>
                      Problema: {order.problem_reported}
                    </Text>
                    <Text fontSize="xs" color={textSecondary}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </VStack>
    </>
  )
} 