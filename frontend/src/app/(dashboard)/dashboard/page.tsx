'use client';

import { useEffect, useState } from 'react'
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
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
  Icon,
  Flex,
  useColorMode,
  Spinner,
  Container,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Button,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import {
  Wrench,
  Box as BoxIcon,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  ShoppingCart,
  Activity,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatBRL } from '@/utils/money'

interface DashboardStats {
  totalInventory: number
  totalInventoryValue: number
  totalServiceOrders: number
  totalServiceOrdersValue: number
  openServiceOrders: number
  criticalAlerts: number
  consumptionTrends: { date: string; quantity: number }[]
  totalSuppliers: number
  totalQuotes: number
  pendingQuotes: number
  totalSupplyRequests: number
  pendingSupplyRequests: number
}

interface Alert {
  id: string
  title: string
  description: string
  danger_level: string
  created_at: string
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
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [recentServiceOrders, setRecentServiceOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const toast = useToast()
  const { colorMode } = useColorMode()

  const isMobile = useBreakpointValue({ base: true, md: false })

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
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.300', 'gray.600');

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
      <VStack spacing={6} align="stretch" bgGradient={bgGradient} minH="100vh" py={ isMobile ? "7vh" : 4}>
        {/* Header */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="xl">
          <CardBody p={6}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <HStack spacing={3} mb={2}>
                  <Box p={3} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white">
                    <BarChart3 size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Heading size="lg" color={textColor} fontWeight="bold">
                      Dashboard
                    </Heading>
                    <Text color={textSecondary} fontSize="md">
                      Visão geral do sistema de gestão
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              
            </Flex>
          </CardBody>
        </Card>

        {/* Grupo 1: Operações */}
        <Box>
          <Heading size="md" mb={4} color={textColor} fontWeight="bold">
            <HStack spacing={2}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, orange.500, red.500)" color="white">
                <Activity size={20} />
              </Box>
              Operações
            </HStack>
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 2 }} spacing={4}>
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/orders')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={3} borderRadius="full" bgGradient="linear(to-r, orange.500, red.500)" color="white">
                    <Wrench size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Ordens de Serviço</Text>
                    <Text fontSize="sm" color={textSecondary}>Gestão de serviços</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>{stats.totalServiceOrders}</StatNumber>
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
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/inventory')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={3} borderRadius="full" bgGradient="linear(to-r, purple.500, pink.500)" color="white">
                    <BoxIcon size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Inventário</Text>
                    <Text fontSize="sm" color={textSecondary}>Gestão de equipamentos</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>{stats.totalInventory}</StatNumber>
                  <StatHelpText fontSize="sm" color={textSecondary}>
                    <StatArrow type="increase" />
                    Itens cadastrados
                  </StatHelpText>
                  <StatHelpText fontSize="sm" color={textSecondary} mt={1}>
                    Valor Total: {formatBRL(stats.totalInventoryValue)}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Grupo 2: Suprimentos */}
        <Box>
          <Heading size="md" mb={4} color={textColor} fontWeight="bold">
            <HStack spacing={2}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, teal.500)" color="white">
                <ShoppingCart size={20} />
              </Box>
              Suprimentos
            </HStack>
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3 }} spacing={4}>
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/suppliers')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={3} borderRadius="full" bgGradient="linear(to-r, blue.500, cyan.500)" color="white">
                    <Users size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Fornecedores</Text>
                    <Text fontSize="sm" color={textSecondary}>Parceiros comerciais</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>{stats.totalSuppliers}</StatNumber>
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
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/quotes')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={3} borderRadius="full" bgGradient="linear(to-r, purple.500, violet.500)" color="white">
                    <FileText size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Cotações</Text>
                    <Text fontSize="sm" color={textSecondary}>Propostas comerciais</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>{stats.totalQuotes}</StatNumber>
                  <StatHelpText fontSize="sm" color={textSecondary}>
                    <StatArrow type={stats.pendingQuotes > 0 ? 'increase' : 'decrease'} />
                    {stats.pendingQuotes} pendentes
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/supply-requests/admin')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={3} borderRadius="full" bgGradient="linear(to-r, teal.500, green.500)" color="white">
                    <ShoppingCart size={24} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Requisições</Text>
                    <Text fontSize="sm" color={textSecondary}>Pedidos de suprimentos</Text>
                  </VStack>
                </HStack>
                <Stat>
                  <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>{stats.totalSupplyRequests}</StatNumber>
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
          <Heading size="md" mb={4} color={textColor} fontWeight="bold">
            <HStack spacing={2}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, green.500, emerald.500)" color="white">
                <TrendingUp size={20} />
              </Box>
              Monitoramento
            </HStack>
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            {/* Gráfico de Linha - Tendências de Consumo */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/statistics')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white">
                    <TrendingUp size={20} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Tendências de Consumo</Text>
                    <Text fontSize="sm" color={textSecondary}>Análise de dados</Text>
                  </VStack>
                </HStack>
                <Box height="280px">
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

            {/* Alertas Recentes */}
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => router.push('/alerts')}
            >
              <CardBody p={5}>
                <HStack spacing={3} mb={3}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, red.500, orange.500)" color="white">
                    <AlertTriangle size={20} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>Alertas Recentes</Text>
                    <Text fontSize="sm" color={textSecondary}>Notificações importantes</Text>
                  </VStack>
                </HStack>
                <VStack align="stretch" spacing={2}>
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
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>{alert.title}</Text>
                        <Badge
                          colorScheme={
                            alert.danger_level === 'ALTO' ? 'red' :
                              alert.danger_level === 'MEDIO' ? 'orange' : 'green'
                          }
                          fontSize="xs"
                          variant="solid"
                        >
                          {alert.danger_level}
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
        <Box>
          <Heading size="md" mb={4} color={textColor} fontWeight="bold">
            <HStack spacing={2}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, yellow.500, orange.500)" color="white">
                <Clock size={20} />
              </Box>
              Atividades Recentes
            </HStack>
          </Heading>
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            shadow="lg"
            _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
            transition="all 0.3s"
            cursor="pointer"
            onClick={() => router.push('/orders')}
          >
            <CardBody p={5}>
              <HStack spacing={3} mb={3}>
                <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, cyan.500)" color="white">
                  <FileText size={20} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>Ordens de Serviço Recentes</Text>
                  <Text fontSize="sm" color={textSecondary}>Últimas atividades</Text>
                </VStack>
              </HStack>
              <VStack align="stretch" spacing={2}>
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