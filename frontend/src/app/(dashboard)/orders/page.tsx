"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Flex,
  Text,
  Badge,
  useToast,
  Input,
  Select,
  HStack,
  InputGroup,
  InputLeftElement,
  VStack,
  useBreakpointValue,
  Card,
  CardBody,
  Stack,
  StackDivider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  Container,
  Divider,
  useColorMode,
  useColorModeValue,
  Center,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import { SearchIcon } from '@chakra-ui/icons'
import { Filter, FileText, Plus, Download, Search, Settings, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import {
  fetchServiceOrders,
  RateLimitError,
  type ServiceOrderDTO,
} from '@/features/operations'
import { filterOrders, generateOrdersPDF, type OrderFilters } from './utils/ordersUtils'
import { formatBRL } from '@/utils/money'
import { formatCivilDateBR } from '@/utils/civilDate'

export default function OrdersPage() {
  const [orders, setOrders] = useState<ServiceOrderDTO[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<OrderFilters>({
    equipment: '',
    status: '',
    date: '',
    serialNumber: ''
  })
  const router = useRouter()
  const toast = useToast()
  const tableRef = useRef<HTMLTableElement>(null)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { colorMode } = useColorMode()

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
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const token = localStorage.getItem('@ti-assistant:token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      router.push('/unauthorized');
      return;
    }

    const fetchOrders = async () => {
      try {
        setError(null)
        const data = await fetchServiceOrders(token)
        setOrders(data)
        setFilteredOrders(data)
      } catch (err: unknown) {
        if (err instanceof RateLimitError) {
          router.push('/rate-limit')
          return
        }
        const message = err instanceof Error ? err.message : 'Erro ao buscar ordens de serviço'
        setError(message)
        toast({
          title: 'Erro',
          description: message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setOrders([])
        setFilteredOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [toast, router])

  useEffect(() => {
    const result = filterOrders(orders, filters)
    setFilteredOrders(result)
  }, [filters, orders])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleGeneratePDF = () => {
    generateOrdersPDF(filteredOrders, filters, toast)
  }

  const renderMobileView = () => (
    <VStack spacing={4} align="stretch">
      {filteredOrders.map(order => (
        <Card
          key={order.id}
          onClick={() => router.push(`/orders/${order.id}`)}
          cursor="pointer"
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          shadow="lg"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'xl',
            borderColor: iconColor
          }}
          transition="all 0.3s"
        >
          <CardBody p={5}>
            <Stack divider={<StackDivider borderColor={cardBorder} />} spacing={3}>
              <Box>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white">
                      <FileText size={16} />
                    </Box>
                    <Text fontWeight="bold" color={textColor}>OS #{order.order_number}</Text>
                  </HStack>
                  <Badge
                    colorScheme={order.exit_date ? 'green' : 'yellow'}
                    variant="solid"
                    fontSize="xs"
                  >
                    {order.exit_date ? 'Concluída' : 'Em andamento'}
                  </Badge>
                </Flex>
              </Box>
              <Box>
                <Text fontWeight="semibold" color={textColor} fontSize="sm">Cliente</Text>
                <Text color={textSecondary} fontSize="sm">{order.client_name}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color={textColor} fontSize="sm">Equipamento</Text>
                <Text color={textSecondary} fontSize="sm">{order.model}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color={textColor} fontSize="sm">Data de Entrada</Text>
                <Text color={textSecondary} fontSize="sm">{formatCivilDateBR(order.entry_date)}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" color={textColor} fontSize="sm">Valor Total</Text>
                <Text color={textColor} fontSize="sm" fontWeight="bold">{formatBRL(order.total_price)}</Text>
              </Box>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  )

  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700');

  const renderDesktopView = () => (
    <Card
      bg={cardBg}
      border="1px solid"
      borderColor={cardBorder}
      shadow="lg"
      overflowX="auto"
    >
      <CardBody p={0}>
        <Table variant="simple" ref={tableRef}>
          <Thead>
            <Tr bg={tableHeaderBg}>
              <Th color={textColor} fontWeight="bold">Nº OS</Th>
              <Th color={textColor} fontWeight="bold">Cliente</Th>
              <Th color={textColor} fontWeight="bold">Equipamento</Th>
              <Th color={textColor} fontWeight="bold">Nº Série</Th>
              <Th color={textColor} fontWeight="bold">Status</Th>
              <Th color={textColor} fontWeight="bold">Data de Entrada</Th>
              <Th color={textColor} fontWeight="bold">Valor Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredOrders.map(order => (
              <Tr
                key={order.id}
                cursor="pointer"
                onClick={() => router.push(`/orders/${order.id}`)}
                transition="all 0.3s"
                _hover={{
                  bg: tableRowHoverBg,
                  transform: 'translateY(-1px)',
                }}
              >
                <Td color={textColor} fontWeight="medium">{order.order_number}</Td>
                <Td color={textColor}>{order.client_name}</Td>
                <Td color={textColor}>{order.model}</Td>
                <Td color={textSecondary} fontSize="sm">{order.serial_number}</Td>
                <Td>
                  <Badge
                    colorScheme={order.exit_date ? 'green' : 'yellow'}
                    variant="solid"
                    fontSize="xs"
                  >
                    {order.exit_date ? 'Concluída' : 'Em andamento'}
                  </Badge>
                </Td>
                <Td color={textSecondary} fontSize="sm">{formatCivilDateBR(order.entry_date)}</Td>
                <Td color={textColor} fontWeight="bold">{formatBRL(order.total_price)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  )

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} display="flex" justifyContent="center" alignItems="center">
        <VStack spacing={4}>
          <Spinner size="xl" color={iconColor} thickness="4px" />
          <Text color={textSecondary} fontSize="lg">Carregando ordens de serviço...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <>
        <VStack spacing={6} align="stretch">
          <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="xl">
            <CardBody p={8} textAlign="center">
              <VStack spacing={4}>
                <Box p={4} borderRadius="full" bgGradient="linear(to-r, red.500, orange.500)" color="white">
                  <AlertTriangle size={32} />
                </Box>
                <VStack spacing={2}>
                  <Heading size="lg" color={textColor} fontWeight="bold">
                    Erro ao Carregar
                  </Heading>
                  <Text color={textSecondary} fontSize="md">
                    {error}
                  </Text>
                </VStack>
                <Button
                  colorScheme="blue"
                  leftIcon={<FileText size={18} />}
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.3s"
                  as={NextLink}
                  href="/orders/new"
                >
                  Nova OS
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </>
    )
  }

  return (
    <VStack spacing={6} align="stretch" bgGradient={bgGradient} p={isMobile ? 0 : 4} py={isMobile ? "7vh" : "0vh"}>
      {/* Header */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="xl">
        <CardBody p={6}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Box>
              <HStack spacing={3} mb={2}>
                <Box p={3} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white">
                  <FileText size={24} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color={textColor} fontWeight="bold">
                    Ordens de Serviço
                  </Heading>
                  <Text color={textSecondary} fontSize="md">
                    Gerencie as ordens de serviço do sistema
                  </Text>
                </VStack>
              </HStack>
            </Box>
            <HStack spacing={3}>
              <Button
                onClick={handleGeneratePDF}
                variant="outline"
                leftIcon={<Download size={18} />}
                colorScheme="green"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              >
                Exportar PDF
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<Plus size={18} />}
                bgGradient="linear(to-r, blue.500, purple.500)"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
                as={NextLink}
                href="/orders/new"
              >
                Nova OS
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Filtros */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
        <CardBody p={6}>
          {isMobile ? (
            <>
              <HStack mb={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Search size={18} color={textSecondary} />
                  </InputLeftElement>
                  <Input
                    name="equipment"
                    placeholder="Buscar equipamento"
                    value={filters.equipment}
                    onChange={handleFilterChange}
                    bg={inputBg}
                    borderColor={inputBorder}
                    _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                    _hover={{ borderColor: iconColor }}
                    transition="all 0.2s"
                  />
                </InputGroup>
                <IconButton
                  aria-label="Filtros"
                  icon={<Filter size={18} />}
                  onClick={onOpen}
                  colorScheme="blue"
                  _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                  transition="all 0.2s"
                />
              </HStack>

              <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent bg={cardBg} borderLeft="1px solid" borderColor={cardBorder}>
                  <DrawerCloseButton />
                  <DrawerHeader color={textColor} borderBottom="1px solid" borderColor={cardBorder}>
                    <HStack spacing={2}>
                      <Filter size={20} />
                      <Text>Filtros</Text>
                    </HStack>
                  </DrawerHeader>
                  <DrawerBody>
                    <VStack spacing={4} pt={4}>
                      <FormControl>
                        <FormLabel color={textColor} fontSize="sm">Status</FormLabel>
                        <Select
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          bg={inputBg}
                          borderColor={inputBorder}
                          _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        >
                          <option value="">Todos</option>
                          <option value="completed">Concluídas</option>
                          <option value="in_progress">Em andamento</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel color={textColor} fontSize="sm">Data</FormLabel>
                        <Input
                          name="date"
                          type="date"
                          value={filters.date}
                          onChange={handleFilterChange}
                          bg={inputBg}
                          borderColor={inputBorder}
                          _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel color={textColor} fontSize="sm">Número de Série</FormLabel>
                        <Input
                          name="serialNumber"
                          value={filters.serialNumber}
                          onChange={handleFilterChange}
                          bg={inputBg}
                          borderColor={inputBorder}
                          _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        />
                      </FormControl>
                    </VStack>
                  </DrawerBody>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <HStack spacing={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color={textSecondary} />
                </InputLeftElement>
                <Input
                  name="equipment"
                  placeholder="Filtrar por equipamento"
                  value={filters.equipment}
                  onChange={handleFilterChange}
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                  _hover={{ borderColor: iconColor }}
                  transition="all 0.2s"
                />
              </InputGroup>

              <Input
                name="serialNumber"
                placeholder="Filtrar por número de série"
                value={filters.serialNumber}
                onChange={handleFilterChange}
                w="200px"
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                _hover={{ borderColor: iconColor }}
                transition="all 0.2s"
              />

              <Select
                name="status"
                placeholder="Status"
                value={filters.status}
                onChange={handleFilterChange}
                w="200px"
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
              >
                <option value="">Todos</option>
                <option value="completed">Concluídas</option>
                <option value="in_progress">Em andamento</option>
              </Select>

              <Input
                name="date"
                type="date"
                value={filters.date}
                onChange={handleFilterChange}
                w="200px"
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                _hover={{ borderColor: iconColor }}
                transition="all 0.2s"
              />
            </HStack>
          )}
        </CardBody>
      </Card>

      {/* Lista de Ordens */}
      {filteredOrders.length === 0 ? (
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
          <CardBody p={12} textAlign="center">
            <VStack spacing={6}>
              <Box p={6} borderRadius="full" bgGradient="linear(to-r, gray.400, gray.500)" color="white">
                <FileText size={48} />
              </Box>
              <VStack spacing={2}>
                <Heading size="lg" color={textColor} fontWeight="bold">
                  Nenhuma ordem encontrada
                </Heading>
                <Text color={textSecondary} fontSize="md">
                  {orders.length === 0
                    ? 'Ainda não há ordens de serviço cadastradas.'
                    : 'Nenhuma ordem corresponde aos filtros aplicados.'
                  }
                </Text>
              </VStack>
              {orders.length === 0 && (
                <Button
                  colorScheme="blue"
                  size="lg"
                  leftIcon={<Plus size={20} />}
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.3s"
                  as={NextLink}
                  href="/orders/new"
                >
                  Criar Primeira OS
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Box flex="1">
          {isMobile ? renderMobileView() : renderDesktopView()}
        </Box>
      )}
    </VStack>

  )
} 