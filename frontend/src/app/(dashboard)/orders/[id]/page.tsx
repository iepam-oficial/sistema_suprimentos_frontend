"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  useToast,
  Grid,
  GridItem,
  Divider,
  Flex,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  ModalFooter,
  useColorModeValue,
  useBreakpointValue,
  Card,
  CardBody,
  Container,
  Icon,
} from '@chakra-ui/react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Monitor, 
  Settings, 
  Wrench, 
  Package, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download,
  Building,
  Phone,
  Mail
} from 'lucide-react'
import jsPDF from 'jspdf'
import { formatBRL } from '@/utils/money'

interface Order {
  id: string
  order_number: string
  client_name: string
  equipment_description: string
  model: string
  serial_number: string
  problem_reported: string
  entry_date: string
  exit_date: string | null
  service_type: string
  accessories: string | null
  notes: string | null
  total_price: number
  supplier_id: string | null
  supplier?: {
    name: string
    phone: string
    email: string
  }
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [exitDate, setExitDate] = useState('')

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

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setError(null)
        const token = localStorage.getItem('@ti-assistant:token')
        if (!token) {
          throw new Error('Token não encontrado')
        }

        console.log('Fazendo requisição para:', `/api/orders/${params.id}`); // Debug log
        const response = await axios.get(`/api/orders/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.status === 429) {
          router.push('/rate-limit');
          return;
        }

        console.log('Resposta recebida:', response.data); // Debug log

        if (response.status !== 200) {
          const errorData = response.data
          throw new Error(errorData.message || 'Erro ao buscar ordem de serviço')
        }

        const data = response.data
        setOrder(data)
      } catch (err: any) {
        console.error('Erro completo:', err); // Debug log
        setError(err.message || 'Erro ao buscar ordem de serviço')
        toast({
          title: 'Erro',
          description: err.message || 'Erro ao buscar ordem de serviço',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [params.id, toast])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      return
    }

    try {
      const token = localStorage.getItem('@ti-assistant:token')
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Erro ao excluir ordem de serviço')
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço excluída com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      router.push('/orders')
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao excluir ordem de serviço',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCompleteOrder = async () => {
    if (!exitDate) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma data de saída',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      const token = localStorage.getItem('@ti-assistant:token')
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const res = await fetch(`/api/orders/${params.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          exit_date: exitDate
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Erro ao finalizar ordem de serviço')
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço finalizada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      onClose()
      // Recarrega a página para mostrar os dados atualizados
      window.location.reload()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao finalizar ordem de serviço',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const generatePDF = () => {
    if (!order) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Add title
    doc.setFontSize(20)
    doc.text('Ordem de Serviço', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(12)

    // Add order details
    let y = 40
    const lineHeight = 10

    const details = [
      ['Número da OS:', order.order_number],
      ['Cliente:', order.client_name],
      ['Equipamento:', order.equipment_description],
      ['Modelo:', order.model],
      ['Número de Série:', order.serial_number],
      ['Problema Reportado:', order.problem_reported],
      ['Tipo de Serviço:', order.service_type],
      ['Data de Entrada:', new Date(order.entry_date).toLocaleDateString()],
      ['Data de Saída:', order.exit_date ? new Date(order.exit_date).toLocaleDateString() : 'Em andamento'],
      ['Valor Total:', formatBRL(order.total_price)]
    ]

    details.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, margin, y)
      y += lineHeight
    })

    if (order.accessories) {
      y += lineHeight
      doc.text(`Acessórios: ${order.accessories}`, margin, y)
    }

    if (order.notes) {
      y += lineHeight
      doc.text(`Observações: ${order.notes}`, margin, y)
    }

    if (order.supplier) {
      y += lineHeight * 2
      doc.text('Dados do Fornecedor:', margin, y)
      y += lineHeight
      doc.text(`Nome: ${order.supplier.name}`, margin, y)
      y += lineHeight
      doc.text(`Telefone: ${order.supplier.phone}`, margin, y)
      y += lineHeight
      doc.text(`Email: ${order.supplier.email}`, margin, y)
    }

    doc.save(`os-${order.order_number}.pdf`)
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh" bgGradient={bgGradient}>
        <VStack spacing={4}>
          <Spinner size="xl" color={iconColor} thickness="4px" />
          <Text color={textColor} fontWeight="medium">Carregando detalhes da ordem...</Text>
        </VStack>
      </Flex>
    )
  }

  if (error || !order) {
    return (
      <VStack spacing={4} align="stretch" bgGradient={bgGradient} p={isMobile ? 4 : 8} minH="100vh">
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="xl">
          <CardBody p={6}>
            <VStack spacing={4}>
              <Box p={3} borderRadius="full" bgGradient="linear(to-r, red.500, pink.500)" color="white">
                <Icon as={FileText} size={24} />
              </Box>
              <Text color={dangerColor} fontWeight="bold" fontSize="lg">
                {error || 'Ordem de serviço não encontrada'}
              </Text>
              <Button
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => router.back()}
                colorScheme="blue"
                bgGradient="linear(to-r, blue.500, purple.500)"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              >
                Voltar
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    )
  }

  return (
    <VStack spacing={4} align="stretch" bgGradient={bgGradient} p={isMobile ? 0 : 4} py={isMobile ? "7vh" : "0vh"}>
      {/* Header */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="xl">
        <CardBody p={3}>
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Box>
              <HStack spacing={3} mb={2}>
                <Box p={3} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white">
                  <FileText size={24} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color={textColor} fontWeight="bold">
                    Detalhes da Ordem de Serviço
                  </Heading>
                  <Text color={textSecondary} fontSize="md">
                    OS: {order.order_number}
                  </Text>
                </VStack>
              </HStack>
            </Box>
            <HStack spacing={2}>
              <Button
                leftIcon={<ArrowLeft size={18} />}
                variant="outline"
                onClick={() => router.back()}
                colorScheme="blue"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              >
                Voltar
              </Button>
              <Button
                leftIcon={<Download size={18} />}
                onClick={generatePDF}
                colorScheme="blue"
                bgGradient="linear(to-r, blue.500, purple.500)"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              >
                Exportar PDF
              </Button>
              {!order.exit_date && (
                <Button
                  leftIcon={<CheckCircle size={18} />}
                  onClick={onOpen}
                  colorScheme="green"
                  bgGradient="linear(to-r, green.500, teal.500)"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.3s"
                >
                  Finalizar OS
                </Button>
              )}
              <IconButton
                aria-label="Editar OS"
                icon={<EditIcon />}
                onClick={() => router.push(`/orders/${order.id}/edit`)}
                colorScheme="blue"
                variant="outline"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              />
              <IconButton
                aria-label="Excluir OS"
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="outline"
                onClick={handleDelete}
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              />
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Status Card */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
        <CardBody p={4}>
          <HStack spacing={3} justify="center">
            <Box p={2} borderRadius="full" bgGradient={order.exit_date ? "linear(to-r, green.500, teal.500)" : "linear(to-r, yellow.500, orange.500)"} color="white">
              {order.exit_date ? <CheckCircle size={20} /> : <Clock size={20} />}
            </Box>
            <VStack align="start" spacing={1}>
              <Text color={textColor} fontWeight="bold" fontSize="lg">
                Status da Ordem
              </Text>
              <Badge 
                colorScheme={order.exit_date ? 'green' : 'yellow'} 
                fontSize="md" 
                px={3} 
                py={1}
                borderRadius="full"
              >
                {order.exit_date ? 'Concluída' : 'Em andamento'}
              </Badge>
            </VStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Informações Principais */}
      <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={4}>
        {/* Dados do Cliente */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
          <CardBody p={4}>
            <HStack spacing={3} mb={4}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, green.500, teal.500)" color="white">
                <User size={20} />
              </Box>
              <Heading size="md" color={textColor} fontWeight="bold">Dados do Cliente</Heading>
            </HStack>
            <Divider mb={4} borderColor={cardBorder} />
            
            <VStack spacing={3} align="stretch">
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Número da OS</Text>
                <Text color={textColor} fontWeight="semibold">{order.order_number}</Text>
              </Box>
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Cliente</Text>
                <Text color={textColor} fontWeight="semibold">{order.client_name}</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Equipamento */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
          <CardBody p={4}>
            <HStack spacing={3} mb={4}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, purple.500, pink.500)" color="white">
                <Monitor size={20} />
              </Box>
              <Heading size="md" color={textColor} fontWeight="bold">Equipamento</Heading>
            </HStack>
            <Divider mb={4} borderColor={cardBorder} />
            
            <VStack spacing={3} align="stretch">
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Descrição</Text>
                <Text color={textColor} fontWeight="semibold">{order.equipment_description}</Text>
              </Box>
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Modelo</Text>
                <Text color={textColor} fontWeight="semibold">{order.model}</Text>
              </Box>
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Número de Série</Text>
                <Text color={textColor} fontWeight="semibold">{order.serial_number}</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Serviço e Datas */}
      <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={4}>
        {/* Serviço */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
          <CardBody p={4}>
            <HStack spacing={3} mb={4}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, orange.500, red.500)" color="white">
                <Wrench size={20} />
              </Box>
              <Heading size="md" color={textColor} fontWeight="bold">Serviço</Heading>
            </HStack>
            <Divider mb={4} borderColor={cardBorder} />
            
            <VStack spacing={3} align="stretch">
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Tipo de Serviço</Text>
                <Text color={textColor} fontWeight="semibold">{order.service_type}</Text>
              </Box>
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Valor Total</Text>
                <Text color={textColor} fontWeight="semibold" fontSize="lg">{formatBRL(order.total_price)}</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Datas */}
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
          <CardBody p={4}>
            <HStack spacing={3} mb={4}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, cyan.500)" color="white">
                <Calendar size={20} />
              </Box>
              <Heading size="md" color={textColor} fontWeight="bold">Datas</Heading>
            </HStack>
            <Divider mb={4} borderColor={cardBorder} />
            
            <VStack spacing={3} align="stretch">
              <Box>
                <Text color={textSecondary} fontSize="sm" fontWeight="medium">Data de Entrada</Text>
                <Text color={textColor} fontWeight="semibold">{new Date(order.entry_date).toLocaleDateString()}</Text>
              </Box>
              {order.exit_date && (
                <Box>
                  <Text color={textSecondary} fontSize="sm" fontWeight="medium">Data de Saída</Text>
                  <Text color={textColor} fontWeight="semibold">{new Date(order.exit_date).toLocaleDateString()}</Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Problema Reportado */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
        <CardBody p={4}>
          <HStack spacing={3} mb={4}>
            <Box p={2} borderRadius="full" bgGradient="linear(to-r, red.500, pink.500)" color="white">
              <Wrench size={20} />
            </Box>
            <Heading size="md" color={textColor} fontWeight="bold">Problema Reportado</Heading>
          </HStack>
          <Divider mb={4} borderColor={cardBorder} />
          
          <Text color={textColor} lineHeight="1.6">{order.problem_reported}</Text>
        </CardBody>
      </Card>

      {/* Informações Adicionais */}
      {(order.accessories || order.notes || order.supplier) && (
        <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
          <CardBody p={4}>
            <HStack spacing={3} mb={4}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, gray.500, gray.600)" color="white">
                <Package size={20} />
              </Box>
              <Heading size="md" color={textColor} fontWeight="bold">Informações Adicionais</Heading>
            </HStack>
            <Divider mb={4} borderColor={cardBorder} />
            
            <VStack spacing={4} align="stretch">
              {order.accessories && (
                <Box>
                  <Text color={textSecondary} fontSize="sm" fontWeight="medium" mb={2}>Acessórios</Text>
                  <Text color={textColor}>{order.accessories}</Text>
                </Box>
              )}
              
              {order.notes && (
                <Box>
                  <Text color={textSecondary} fontSize="sm" fontWeight="medium" mb={2}>Observações</Text>
                  <Text color={textColor}>{order.notes}</Text>
                </Box>
              )}
              
              {order.supplier && (
                <Box>
                  <Text color={textSecondary} fontSize="sm" fontWeight="medium" mb={3}>Fornecedor</Text>
                  <VStack spacing={2} align="stretch">
                    <HStack spacing={2}>
                      <Box p={1} borderRadius="full" bg={iconColor} color="white">
                        <Building size={16} />
                      </Box>
                      <Text color={textColor} fontWeight="semibold">{order.supplier.name}</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box p={1} borderRadius="full" bg={successColor} color="white">
                        <Phone size={16} />
                      </Box>
                      <Text color={textColor}>{order.supplier.phone}</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box p={1} borderRadius="full" bg={warningColor} color="white">
                        <Mail size={16} />
                      </Box>
                      <Text color={textColor}>{order.supplier.email}</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Modal de Finalização */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          shadow="2xl"
        >
          <ModalHeader color={textColor} borderBottom="1px solid" borderColor={cardBorder}>
            <HStack spacing={3}>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, green.500, teal.500)" color="white">
                <CheckCircle size={20} />
              </Box>
              <Text>Finalizar Ordem de Serviço</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody py={6}>
            <FormControl>
              <FormLabel color={textColor} fontWeight="semibold">Data de Saída</FormLabel>
              <Input
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                _hover={{ borderColor: iconColor }}
                transition="all 0.2s"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor={cardBorder}>
            <Button
              variant="outline"
              mr={3}
              onClick={onClose}
              colorScheme="blue"
              _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
              transition="all 0.2s"
            >
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={handleCompleteOrder}
              bgGradient="linear(to-r, green.500, teal.500)"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.3s"
              leftIcon={<CheckCircle size={18} />}
            >
              Finalizar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
} 