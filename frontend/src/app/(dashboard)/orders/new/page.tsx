"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createServiceOrder,
  RateLimitError,
  type CreateServiceOrderInput,
} from '@/features/operations'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  VStack,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Flex,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Card,
  CardBody,
  useBreakpointValue,
} from '@chakra-ui/react'
import {
  ArrowLeft,
  FileText,
  User,
  Monitor,
  Settings,
  Wrench,
  Package,
  DollarSign,
  CheckCircle,
  Plus
} from 'lucide-react'

interface FormData {
  order_number: string
  client_name: string
  equipment_description: string
  model: string
  serial_number: string
  problem_reported: string
  service_type: string
  accessories: string
  notes: string
  total_price: number
}

export default function NewOrderPage() {
  const [formData, setFormData] = useState<FormData>({
    order_number: '',
    client_name: '',
    equipment_description: '',
    model: '',
    serial_number: '',
    problem_reported: '',
    service_type: '',
    accessories: '',
    notes: '',
    total_price: 0
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, total_price: parseFloat(value) || 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)
    try {
      const token = localStorage.getItem('@ti-assistant:token')
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const dataToSend: CreateServiceOrderInput = {
        serial_number: formData.serial_number,
        problem_reported: formData.problem_reported,
        service_type: formData.service_type,
        total_price: formData.total_price,
        entry_date: new Date().toISOString(),
      };
      if (formData.order_number.trim()) dataToSend.order_number = formData.order_number;
      if (formData.client_name.trim()) dataToSend.client_name = formData.client_name;
      if (formData.equipment_description.trim()) dataToSend.equipment_description = formData.equipment_description;
      if (formData.model.trim()) dataToSend.model = formData.model;
      if (formData.accessories.trim()) dataToSend.accessories = formData.accessories;
      if (formData.notes.trim()) dataToSend.notes = formData.notes;

      await createServiceOrder(token, dataToSend)

      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço criada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      router.push('/orders')
    } catch (err: unknown) {
      if (err instanceof RateLimitError) {
        router.push('/rate-limit')
        return
      }
      const message = err instanceof Error ? err.message : 'Erro ao criar ordem de serviço'
      setFormError(message)
      toast({
        title: 'Erro',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
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
                  <Plus size={24} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color={textColor} fontWeight="bold">
                    Nova Ordem de Serviço
                  </Heading>
                  <Text color={textSecondary} fontSize="md">
                    Crie uma nova ordem de serviço no sistema
                  </Text>
                </VStack>
              </HStack>
            </Box>
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
          </Flex>
        </CardBody>
      </Card>

      {/* Formulário */}
      <Card bg={cardBg} border="1px solid" borderColor={cardBorder} shadow="lg">
        <CardBody p={ isMobile ? 3 : 8 }>
          {formError && (
            <Alert status="error" mb={6} borderRadius="lg" bg="red.50" border="1px solid" borderColor="red.200">
              <AlertIcon color={dangerColor} />
              <Text color={dangerColor} fontWeight="medium">{formError}</Text>
            </Alert>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <VStack spacing={8} align="stretch">
              {/* Dados do Cliente */}
              <Box>
                <HStack spacing={3} mb={4}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, green.500, teal.500)" color="white">
                    <User size={20} />
                  </Box>
                  <Heading size="md" color={textColor} fontWeight="bold">Dados do Cliente</Heading>
                </HStack>
                <Divider mb={6} borderColor={cardBorder} />

                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Número da OS (opcional)</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FileText size={18} color={textSecondary} />
                      </InputLeftElement>
                      <Input
                        name="order_number"
                        value={formData.order_number}
                        onChange={handleChange}
                        placeholder="Deixe em branco para gerar automaticamente"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        _hover={{ borderColor: iconColor }}
                        transition="all 0.2s"
                        autoFocus
                      />
                    </InputGroup>
                    <Text fontSize="sm" color={textSecondary} mt={2}>
                      Se não preenchido, será gerado automaticamente no formato OS20241201123456
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Nome do Cliente</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <User size={18} color={textSecondary} />
                      </InputLeftElement>
                      <Input
                        name="client_name"
                        value={formData.client_name}
                        onChange={handleChange}
                        placeholder="Digite o nome do cliente"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        _hover={{ borderColor: iconColor }}
                        transition="all 0.2s"
                      />
                    </InputGroup>
                  </FormControl>
                </VStack>
              </Box>

              {/* Equipamento */}
              <Box>
                <HStack spacing={3} mb={4}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, purple.500, pink.500)" color="white">
                    <Monitor size={20} />
                  </Box>
                  <Heading size="md" color={textColor} fontWeight="bold">Equipamento</Heading>
                </HStack>
                <Divider mb={6} borderColor={cardBorder} />

                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Descrição do Equipamento</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Monitor size={18} color={textSecondary} />
                      </InputLeftElement>
                      <Input
                        name="equipment_description"
                        value={formData.equipment_description}
                        onChange={handleChange}
                        placeholder="Digite a descrição do equipamento"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        _hover={{ borderColor: iconColor }}
                        transition="all 0.2s"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Modelo do Equipamento</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Settings size={18} color={textSecondary} />
                      </InputLeftElement>
                      <Input
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        placeholder="Digite o modelo do equipamento"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        _hover={{ borderColor: iconColor }}
                        transition="all 0.2s"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor} fontWeight="semibold">Número de Série</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FileText size={18} color={textSecondary} />
                      </InputLeftElement>
                      <Input
                        name="serial_number"
                        value={formData.serial_number}
                        onChange={handleChange}
                        placeholder="Digite o número de série"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        _hover={{ borderColor: iconColor }}
                        transition="all 0.2s"
                      />
                    </InputGroup>
                  </FormControl>
                </VStack>
              </Box>

              {/* Serviço */}
              <Box>
                <HStack spacing={3} mb={4}>
                  <Box p={2} borderRadius="full" bgGradient="linear(to-r, orange.500, red.500)" color="white">
                    <Wrench size={20} />
                  </Box>
                  <Heading size="md" color={textColor} fontWeight="bold">Serviço</Heading>
                </HStack>
                <Divider mb={6} borderColor={cardBorder} />

                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel color={textColor} fontWeight="semibold">Problema Reportado</FormLabel>
                    <Textarea
                      name="problem_reported"
                      value={formData.problem_reported}
                      onChange={handleChange}
                      placeholder="Descreva o problema reportado"
                      bg={inputBg}
                      borderColor={inputBorder}
                      _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                      _hover={{ borderColor: iconColor }}
                      transition="all 0.2s"
                      rows={4}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor} fontWeight="semibold">Tipo de Serviço</FormLabel>
                    <Select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      placeholder="Selecione o tipo de serviço"
                      bg={inputBg}
                      borderColor={inputBorder}
                      _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                    >
                      <option value="manutencao">Manutenção</option>
                      <option value="reparo">Reparo</option>
                      <option value="instalacao">Instalação</option>
                      <option value="configuracao">Configuração</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Acessórios</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Package size={18} color={textSecondary} />
                      </InputLeftElement>
                      <Input
                        name="accessories"
                        value={formData.accessories}
                        onChange={handleChange}
                        placeholder="Digite os acessórios"
                        bg={inputBg}
                        borderColor={inputBorder}
                        _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                        _hover={{ borderColor: iconColor }}
                        transition="all 0.2s"
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Observações</FormLabel>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Digite as observações"
                      bg={inputBg}
                      borderColor={inputBorder}
                      _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                      _hover={{ borderColor: iconColor }}
                      transition="all 0.2s"
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor} fontWeight="semibold">Valor Total</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <DollarSign size={18} color={textSecondary} />
                      </InputLeftElement>
                      <NumberInput
                        value={formData.total_price}
                        onChange={handlePriceChange}
                        min={0}
                        precision={2}
                        w="full"
                      >
                        <NumberInputField
                          bg={inputBg}
                          borderColor={inputBorder}
                          _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                          _hover={{ borderColor: iconColor }}
                          transition="all 0.2s"
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </InputGroup>
                  </FormControl>
                </VStack>
              </Box>

              {/* Botões */}
              <Divider borderColor={cardBorder} />
              <Flex justify="flex-end" gap={4}>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  colorScheme="blue"
                  _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                  transition="all 0.2s"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading}
                  leftIcon={<CheckCircle size={18} />}
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.3s"
                >
                  Criar Ordem de Serviço
                </Button>
              </Flex>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </VStack>

  )
} 