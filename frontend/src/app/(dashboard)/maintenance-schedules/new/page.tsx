'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Switch,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Center,
  useColorModeValue,
  useBreakpointValue,
  Stack,
  Badge,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { ArrowLeft, Save, Settings, Calendar, Clock, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useAuthSession } from '@/features/identity';
import {
  createMaintenanceSchedule,
  RateLimitError,
  type CreateMaintenanceScheduleInput,
} from '@/features/operations';

interface Inventory {
  id: string;
  name: string;
  serial_number: string;
  model: string;
}

export default function NewMaintenanceSchedulePage() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('blue.50', 'blue.900');
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, gray.900, blue.900)'
  );
  
  // Cores de texto para modo claro/escuro
  const textColor = useColorModeValue('gray.900', 'white');
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300');
  const textColorMuted = useColorModeValue('gray.500', 'gray.400');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const badgeBg = useColorModeValue('green.50', 'green.900');
  const badgeColor = useColorModeValue('green.700', 'green.300');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700');
  const buttonActiveBg = useColorModeValue('gray.100', 'gray.600');
  const blueHoverBg = useColorModeValue('blue.50', 'blue.900');
  const blueActiveBg = useColorModeValue('blue.100', 'blue.800');

  const [formData, setFormData] = useState({
    inventory_id: '',
    type: '',
    interval_days: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    fetchInventories();
  }, []);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredInventories([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = inventories.filter(inventory =>
      inventory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventories(filtered.slice(0, 10)); // Limitar a 10 sugestões
    setShowSuggestions(filtered.length > 0);
  }, [searchTerm, inventories]);

  const fetchInventories = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/');
        return;
      }
      const response = await fetch('/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 429) {
        router.push('/rate-limit');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setInventories(data);
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar inventário',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar inventário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleInventorySelect = (inventory: Inventory) => {
    setSearchTerm(`${inventory.name} - ${inventory.serial_number}`);
    setFormData({ ...formData, inventory_id: inventory.id });
    setShowSuggestions(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Se o usuário limpar o campo, limpar também o inventory_id
    if (!value) {
      setFormData({ ...formData, inventory_id: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) {
        router.push('/');
        return;
      }

      const input: CreateMaintenanceScheduleInput = {
        inventory_id: formData.inventory_id,
        type: formData.type,
        interval_days: parseInt(formData.interval_days, 10),
        notes: formData.notes || undefined,
        active: formData.active,
      };

      await createMaintenanceSchedule(token, input);
      toast({
        title: 'Sucesso!',
        description: 'Agendamento de manutenção criado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/maintenance-schedules');
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: 'Erro!',
        description:
          error instanceof Error ? error.message : 'Erro ao criar agendamento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      MAINTENANCE: 'Manutenção',
      INSTALLATION: 'Instalação',
      CALIBRATION: 'Calibração',
      CLEANING: 'Limpeza',
      CONFIGURATION: 'Configuração',
      INSPECTION: 'Vistoria',
      OTHER: 'Outro'
    };
    return types[type] || type;
  };

  return (
    <>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch" 
        py={ isMobile ? "7vh" : 10}
        maxW="container.lg" mx="auto" px={{ base: 4, md: 6 }}>
        {/* Header */}
        <Card
          bg={cardBg}
          shadow="lg"
          borderWidth={1}
          borderColor={borderColor}
          borderRadius="xl"
        >
          <CardBody p={{ base: 4, md: 6 }}>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ base: 'start', md: 'center' }}>
              <Link href="/maintenance-schedules">
                <Button
                  variant="outline"
                  size={{ base: 'sm', md: 'md' }}
                  leftIcon={<ArrowLeft size={16} />}
                  colorScheme="blue"
                  _hover={{ bg: blueHoverBg }}
                  _active={{ bg: blueActiveBg }}
                >
                  Voltar
                </Button>
              </Link>
              <Box flex={1}>
                <HStack spacing={3} mb={2}>
                  <Icon as={Settings} boxSize={6} color="blue.500" />
                  <Heading size={{ base: 'md', md: 'lg' }} color={textColor}>
                    Novo Agendamento de Manutenção
                  </Heading>
                </HStack>
                <Text color={textColorSecondary} fontSize={{ base: 'sm', md: 'md' }}>
                  Configure um agendamento de manutenção preventiva para equipamentos
                </Text>
              </Box>
            </Stack>
          </CardBody>
        </Card>

        <form onSubmit={handleSubmit}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Card Principal */}
            <Card
              bg={cardBg}
              shadow="xl"
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="xl"
              overflow="hidden"
            >
              <CardHeader
                bgGradient="linear(to-r, blue.500, purple.500)"
                color="white"
                py={{ base: 4, md: 6 }}
              >
                <HStack spacing={3}>
                  <Icon as={Wrench} boxSize={5} />
                  <Heading size={{ base: 'sm', md: 'md' }}>
                    Informações do Agendamento
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody p={{ base: 4, md: 6 }}>
                <VStack spacing={{ base: 4, md: 6 }}>
                  {/* Equipamento */}
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'sm', md: 'md' }} fontWeight="semibold" color={labelColor}>
                      Equipamento
                    </FormLabel>
                    <Box position="relative">
                      <Input
                        placeholder="Buscar equipamento por nome, modelo ou número de série..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        ref={searchInputRef}
                        autoComplete="off"
                        size={{ base: 'sm', md: 'md' }}
                        borderWidth={2}
                        _focus={{
                          borderColor: 'blue.500',
                          boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                        }}
                        _hover={{ borderColor: 'blue.300' }}
                      />
                      {showSuggestions && (
                        <Box
                          borderWidth={2}
                          borderRadius="lg"
                          mt={2}
                          bg={cardBg}
                          shadow="2xl"
                          zIndex={10}
                          position="absolute"
                          w="full"
                          maxH="200px"
                          overflowY="auto"
                          borderColor="blue.200"
                        >
                          {filteredInventories.map((inventory) => (
                            <Box
                              key={inventory.id}
                              px={4}
                              py={3}
                              _hover={{ bg: hoverBg, cursor: 'pointer' }}
                              onClick={() => handleInventorySelect(inventory)}
                              borderBottomWidth={1}
                              borderBottomColor={borderColor}
                              transition="all 0.2s"
                            >
                              <Text fontWeight="semibold" color={textColor}>{inventory.name}</Text>
                              <Text fontSize="sm" color={textColorMuted}>
                                {inventory.model} - {inventory.serial_number}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                    {formData.inventory_id && (
                      <HStack mt={2} spacing={2}>
                        <Badge 
                          bg={badgeBg} 
                          color={badgeColor} 
                          variant="subtle" 
                          size="sm"
                        >
                          ✓ Equipamento selecionado
                        </Badge>
                      </HStack>
                    )}
                  </FormControl>

                  <Divider />

                  {/* Tipo de Serviço */}
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'sm', md: 'md' }} fontWeight="semibold" color={labelColor}>
                      Tipo de Serviço
                    </FormLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="Selecione o tipo de serviço"
                      size={{ base: 'sm', md: 'md' }}
                      borderWidth={2}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      _hover={{ borderColor: 'blue.300' }}
                    >
                      <option value="MAINTENANCE">🔧 Manutenção</option>
                      <option value="CALIBRATION">⚖️ Calibração</option>
                      <option value="CLEANING">🧹 Limpeza</option>
                      <option value="INSPECTION">🔍 Vistoria</option>
                      <option value="CONFIGURATION">⚙️ Configuração</option>
                      <option value="INSTALLATION">🔨 Instalação</option>
                      <option value="OTHER">📋 Outro</option>
                    </Select>
                  </FormControl>

                  <Divider />

                  {/* Intervalo */}
                  <FormControl isRequired>
                    <FormLabel fontSize={{ base: 'sm', md: 'md' }} fontWeight="semibold" color={labelColor}>
                      <HStack spacing={2}>
                        <Icon as={Calendar} boxSize={4} color="blue.500" />
                        <Text>Intervalo (dias)</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 90 para calibração trimestral"
                      value={formData.interval_days}
                      onChange={(e) => setFormData({ ...formData, interval_days: e.target.value })}
                      size={{ base: 'sm', md: 'md' }}
                      borderWidth={2}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      _hover={{ borderColor: 'blue.300' }}
                    />
                    <Text fontSize="sm" color={textColorMuted} mt={2}>
                      Intervalo em dias entre cada execução da tarefa
                    </Text>
                  </FormControl>

                  <Divider />

                  {/* Observações */}
                  <FormControl>
                    <FormLabel fontSize={{ base: 'sm', md: 'md' }} fontWeight="semibold" color={labelColor}>
                      Observações
                    </FormLabel>
                    <Textarea
                      placeholder="Observações sobre o agendamento..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      size={{ base: 'sm', md: 'md' }}
                      borderWidth={2}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                      }}
                      _hover={{ borderColor: 'blue.300' }}
                    />
                  </FormControl>

                  <Divider />

                  {/* Status Ativo */}
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0} fontSize={{ base: 'sm', md: 'md' }} fontWeight="semibold" color={labelColor}>
                        <HStack spacing={2}>
                          <Icon as={Clock} boxSize={4} color="blue.500" />
                          <Text>Agendamento Ativo</Text>
                        </HStack>
                      </FormLabel>
                      <Text fontSize="sm" color={textColorMuted} mt={1}>
                        Desative para pausar a criação de novas tarefas
                      </Text>
                    </Box>
                    <Switch
                      isChecked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      colorScheme="blue"
                      size="lg"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Botões */}
            <Card
              bg={cardBg}
              shadow="md"
              borderWidth={1}
              borderColor={borderColor}
              borderRadius="xl"
            >
              <CardBody p={{ base: 4, md: 6 }}>
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} justify="center">
                  <Link href="/maintenance-schedules" style={{ width: '100%' }}>
                    <Button
                      variant="outline"
                      size={{ base: 'md', md: 'lg' }}
                      w="full"
                      colorScheme="gray"
                      _hover={{ bg: buttonHoverBg }}
                      _active={{ bg: buttonActiveBg }}
                    >
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    isLoading={loading}
                    leftIcon={<Save size={18} />}
                    colorScheme="blue"
                    size={{ base: 'md', md: 'lg' }}
                    w="full"
                    bgGradient="linear(to-r, blue.500, purple.500)"
                    _hover={{
                      bgGradient: 'linear(to-r, blue.600, purple.600)',
                      transform: 'translateY(-1px)',
                      boxShadow: 'lg'
                    }}
                    _active={{
                      bgGradient: 'linear(to-r, blue.700, purple.700)',
                      transform: 'translateY(0)'
                    }}
                    transition="all 0.2s"
                  >
                    {loading ? 'Criando...' : 'Criar Agendamento'}
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </form>
      </VStack>
    </>
  );
} 