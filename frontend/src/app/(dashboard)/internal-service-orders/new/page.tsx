"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  VStack,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  Divider,
  Flex,
  Text,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { Wrench, Building2, Layers, ClipboardList } from 'lucide-react';
import type { InventoryItem } from '../../inventory/types';
import { useRef } from 'react';
import {
  fetchLocations,
  fetchLocales,
  type LocationDTO,
  type LocaleDTO,
} from '@/features/reference-data';
import { useAuthSession } from '@/features/identity';
import {
  createInternalServiceOrder,
  type CreateInternalServiceOrderInput,
} from '@/features/operations';

export default function NewInternalServiceOrderPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inventory_id: '',
    location_id: '',
    sector_id: '',
    start_date: '',
    end_date: '',
    time_spent_hours: 0,
    type: '',
    notes: '',
    locale_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const { token } = useAuthSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [locales, setLocales] = useState<LocaleDTO[]>([]);
  const [serialInput, setSerialInput] = useState('');
  const [serialSuggestions, setSerialSuggestions] = useState<string[]>([]);
  const serialInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) return;
        // Buscar inventário
        const invRes = await fetch('/api/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const invData = await invRes.json();
        setInventory(Array.isArray(invData) ? invData : []);
        const locData = await fetchLocations(token);
        setLocations(locData);
      } catch (err) {
        // Silenciar erro, já há toast no submit
      }
    };
    fetchData();
  }, [token]);

  // Buscar ambientes quando o polo mudar
  useEffect(() => {
    if (formData.location_id) {
      const loadLocales = async () => {
        try {
          if (!token) return;
          const data = await fetchLocales(token);
          setLocales(data.filter((l) => l.location_id === formData.location_id));
        } catch (err) {
          setLocales([]);
        }
      };
      loadLocales();
    } else {
      setLocales([]);
    }
  }, [formData.location_id, token]);

  // Atualizar sugestões conforme digita
  useEffect(() => {
    if (serialInput.length === 0) {
      setSerialSuggestions([]);
      return;
    }
    const filtered = inventory
      .filter(item =>
        item.serial_number.toLowerCase().includes(serialInput.toLowerCase()) ||
        item.name.toLowerCase().includes(serialInput.toLowerCase()) ||
        item.model.toLowerCase().includes(serialInput.toLowerCase())
      )
      .map(item => item.serial_number);
    setSerialSuggestions(filtered.slice(0, 10)); // Limitar sugestões
  }, [serialInput, inventory]);

  // Quando seleciona uma sugestão
  const handleSerialSelect = (serial: string) => {
    setSerialInput(serial);
    setSerialSuggestions([]);
    const found = inventory.find(item => item.serial_number === serial);
    setFormData(prev => ({ ...prev, inventory_id: found ? found.id : '', location_id: '', locale_id: '' }));
  };

  // Quando digita manualmente
  const handleSerialInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSerialInput(value);
    const found = inventory.find(item => item.serial_number === value);
    setFormData(prev => ({ ...prev, inventory_id: found ? found.id : '', location_id: '', locale_id: '' }));
  };

  // Atualizar tempo gasto automaticamente ao mudar datas
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        setFormData((prev) => ({ ...prev, time_spent_hours: Number(diffHours.toFixed(2)) }));
      } else {
        setFormData((prev) => ({ ...prev, time_spent_hours: 0 }));
      }
    } else {
      setFormData((prev) => ({ ...prev, time_spent_hours: 0 }));
    }
  }, [formData.start_date, formData.end_date]);

  // TODO: Buscar opções de inventário, local, setor e tipos de serviço do backend

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (valueAsString: string, valueAsNumber: number) => {
    setFormData((prev) => ({ ...prev, time_spent_hours: valueAsNumber }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      // Validação: pelo menos um dos dois deve ser preenchido
      if (!formData.inventory_id && !formData.location_id) {
        setFormError('Selecione um item do inventário OU um polo para a OS interna.');
        setLoading(false);
        return;
      }
      // Não permitir ambos ao mesmo tempo
      if (formData.inventory_id && formData.location_id) {
        setFormError('Selecione apenas um: inventário OU polo.');
        setLoading(false);
        return;
      }
      // Se for predial, ambiente é obrigatório
      if (formData.location_id && !formData.locale_id) {
        setFormError('Selecione o ambiente do polo.');
        setLoading(false);
        return;
      }
      if (!token) {
        throw new Error('Token não encontrado');
      }
      const dataToSend: CreateInternalServiceOrderInput = {
        title: formData.title,
        description: formData.description || undefined,
        inventory_id: formData.inventory_id || undefined,
        location_id: formData.location_id || undefined,
        sector_id: formData.sector_id || undefined,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : '',
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
        time_spent_hours: formData.time_spent_hours,
        type: formData.type || undefined,
        notes: formData.notes || undefined,
      };
      await createInternalServiceOrder(token, dataToSend);
      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço interna criada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/internal-service-orders');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar ordem de serviço interna');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('md', 'dark-lg');

  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Card w={{ base: '100%', md: '600px' }} bg={cardBg} shadow={cardShadow} borderRadius="xl" p={{ base: 4, md: 8 }}>
        <CardHeader pb={0}>
          <HStack spacing={3} mb={2}>
            <Icon as={Wrench} boxSize={7} color="blue.500" />
            <Heading size="lg">Nova Ordem de Serviço Interna</Heading>
          </HStack>
          <Text color="gray.500" fontSize="md" mb={2}>
            Preencha os dados para registrar uma OS interna vinculada a um equipamento ou a um ambiente do polo.
          </Text>
        </CardHeader>
        <Divider my={2} />
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <Box>
                <HStack spacing={2} mb={2}>
                  <Icon as={ClipboardList} color="blue.400" />
                  <Text fontWeight="bold">Informações Gerais</Text>
                </HStack>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Título</FormLabel>
                    <Input name="title" value={formData.title} onChange={handleChange} placeholder="Título da OS" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Descrição</FormLabel>
                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição detalhada" rows={3} />
                  </FormControl>
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Data de Início</FormLabel>
                      <Input type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Data de Fim</FormLabel>
                      <Input type="datetime-local" name="end_date" value={formData.end_date} onChange={handleChange} />
                    </FormControl>
                  </HStack>
                  <FormControl>
                    <FormLabel>Tempo Gasto (horas)</FormLabel>
                    <NumberInput min={0} value={formData.time_spent_hours} onChange={handleNumberChange} w="100%">
                      <NumberInputField name="time_spent_hours" />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Tipo de Serviço</FormLabel>
                    <Select name="type" value={formData.type} onChange={handleChange} placeholder="Selecione o tipo">
                      <option value="MAINTENANCE">Manutenção</option>
                      <option value="INSTALLATION">Instalação</option>
                      <option value="CALIBRATION">Calibração</option>
                      <option value="CLEANING">Limpeza</option>
                      <option value="CONFIGURATION">Configuração</option>
                      <option value="INSPECTION">Inspeção</option>
                      <option value="OTHER">Outro</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Observações</FormLabel>
                    <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações adicionais" rows={2} />
                  </FormControl>
                </VStack>
              </Box>
              <Divider />
              <Box>
                <HStack spacing={2} mb={2}>
                  <Icon as={Layers} color="orange.400" />
                  <Text fontWeight="bold">Vinculação</Text>
                </HStack>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Número de Série do Equipamento</FormLabel>
                    <Input
                      name="serial_number"
                      value={serialInput}
                      onChange={handleSerialInputChange}
                      placeholder="Digite ou cole o número de série"
                      isDisabled={!!formData.location_id}
                      autoComplete="off"
                      ref={serialInputRef}
                    />
                    {serialSuggestions.length > 0 && (
                      <Box borderWidth={1} borderRadius="md" mt={1} bg={cardBg} shadow="sm" zIndex={10} position="absolute" w="full" maxH="180px" overflowY="auto">
                        {serialSuggestions.map((serial) => (
                          <Box
                            key={serial}
                            px={3}
                            py={2}
                            _hover={{ bg: 'blue.50', cursor: 'pointer' }}
                            onClick={() => handleSerialSelect(serial)}
                          >
                            {serial}
                            <Text fontSize="xs" color="gray.500">
                              {inventory.find(i => i.serial_number === serial)?.name} - {inventory.find(i => i.serial_number === serial)?.model}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </FormControl>
                  <Text align="center" color="gray.400" fontSize="sm">ou</Text>
                  <FormControl>
                    <FormLabel>Local (Polo para manutenção predial)</FormLabel>
                    <Select
                      name="location_id"
                      value={formData.location_id}
                      onChange={handleChange}
                      placeholder="Selecione um polo"
                      isDisabled={!!formData.inventory_id}
                      bg={formData.location_id ? 'orange.50' : undefined}
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} - {loc.branch}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  {formData.location_id && (
                    <FormControl>
                      <FormLabel>Ambiente</FormLabel>
                      <Select
                        name="locale_id"
                        value={formData.locale_id || ''}
                        onChange={handleChange}
                        placeholder="Selecione o ambiente"
                        bg={formData.locale_id ? 'orange.100' : undefined}
                      >
                        {locales.map(locale => (
                          <option key={locale.id} value={locale.id}>
                            {locale.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </VStack>
              </Box>
              {formError && <Text color="red.500" fontWeight="bold">{formError}</Text>}
            </VStack>
            <CardFooter px={0} pt={8}>
              <Button type="submit" colorScheme="blue" w="full" size="lg" isLoading={loading} fontWeight="bold">
                Criar OS Interna
              </Button>
            </CardFooter>
          </form>
        </CardBody>
      </Card>
    </Flex>
  );
} 