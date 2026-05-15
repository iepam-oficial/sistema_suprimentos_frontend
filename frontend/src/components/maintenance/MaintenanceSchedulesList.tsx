'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Button,
  Badge,
  Input,
  Select,
  Text,
  VStack,
  HStack,
  Stack,
  Flex,
  useBreakpointValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { Calendar, Clock, Settings, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export interface MaintenanceSchedule {
  id: string;
  inventory: {
    id: string;
    name: string;
    serial_number: string;
  };
  technician: {
    id: string;
    name: string;
  };
  type: string;
  interval_days: number;
  notes?: string;
  active: boolean;
  created_at: string;
  tasks: Array<{
    id: string;
    status: string;
    due_date: string;
  }>;
  nextMaintenanceDate: string;
  nextPendingTask?: {
    id: string;
    status: string;
    due_date: string;
  };
}

export function MaintenanceSchedulesList() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isMobile = useBreakpointValue({ base: true, md: false });
  const router = useRouter();

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        if (!token) {
          router.push('/');
          return;
        }
        const response = await fetch('/api/maintenance-schedules', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 429) {
          router.push('/rate-limit');
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setSchedules(data);
        }
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [router]);

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.inventory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.inventory.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.technician.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || schedule.type === typeFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && schedule.active) ||
      (statusFilter === 'inactive' && !schedule.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      MAINTENANCE: 'Manutenção',
      INSTALLATION: 'Instalação',
      CALIBRATION: 'Calibração',
      CLEANING: 'Limpeza',
      CONFIGURATION: 'Configuração',
      INSPECTION: 'Vistoria',
      OTHER: 'Outro',
    };
    return types[type] || type;
  };

  const getNextTaskDate = (schedule: MaintenanceSchedule) => {
    if (schedule.nextPendingTask) {
      return schedule.nextPendingTask.due_date;
    }
    return schedule.nextMaintenanceDate;
  };

  const getNextMaintenanceStatus = (schedule: MaintenanceSchedule) => {
    const nextDate = getNextTaskDate(schedule);
    if (!nextDate) return { status: 'no-date', color: 'gray' };

    const today = new Date();
    const nextMaintenance = new Date(nextDate);
    const daysUntilNext = Math.ceil(
      (nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilNext < 0) {
      return { status: 'overdue', color: 'red', days: Math.abs(daysUntilNext) };
    }
    if (daysUntilNext <= 7) {
      return { status: 'urgent', color: 'orange', days: daysUntilNext };
    }
    if (daysUntilNext <= 30) {
      return { status: 'soon', color: 'yellow', days: daysUntilNext };
    }
    return { status: 'normal', color: 'green', days: daysUntilNext };
  };

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      <Card shadow="sm">
        <CardBody p={{ base: 3, md: 4 }}>
          <Stack spacing={3}>
            <Flex
              gap={2}
              flexWrap="wrap"
              align={{ base: 'stretch', md: 'flex-end' }}
              direction={{ base: 'column', md: 'row' }}
            >
              <Box position="relative" flex={{ md: '1 1 200px' }} minW={{ md: '180px' }}>
                <Input
                  placeholder="Buscar equipamento, técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  pl={9}
                  size="sm"
                />
                <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" color="gray.400">
                  <Search size={14} />
                </Box>
              </Box>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                size="sm"
                flex={{ md: '0 1 150px' }}
                maxW={{ base: 'full', md: '160px' }}
              >
                <option value="">Todos os tipos</option>
                <option value="MAINTENANCE">Manutenção</option>
                <option value="CALIBRATION">Calibração</option>
                <option value="CLEANING">Limpeza</option>
                <option value="INSPECTION">Vistoria</option>
                <option value="CONFIGURATION">Configuração</option>
                <option value="INSTALLATION">Instalação</option>
                <option value="OTHER">Outro</option>
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
                flex={{ md: '0 1 120px' }}
                maxW={{ base: 'full', md: '130px' }}
              >
                <option value="">Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </Select>
              <Button
                colorScheme="blue"
                size="sm"
                variant="outline"
                leftIcon={<Filter size={16} />}
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
                flexShrink={0}
              >
                Limpar
              </Button>
              <Box flex={{ base: '1 1 100%', md: '0 0 auto' }} w={{ base: 'full', md: 'auto' }} ml={{ md: 'auto' }}>
                <Link href="/maintenance-schedules/new">
                  <Button leftIcon={<Plus size={16} />} colorScheme="blue" size="sm" w={{ base: 'full', md: 'auto' }}>
                    Novo agendamento
                  </Button>
                </Link>
              </Box>
            </Flex>
          </Stack>
        </CardBody>
      </Card>

      <VStack spacing={3} align="stretch">
        {filteredSchedules.length === 0 ? (
          <Card shadow="sm">
            <CardBody p={{ base: 5, md: 6 }} textAlign="center">
              <VStack spacing={3}>
                <Settings color="gray.400" />
                <Heading size={{ base: 'sm', md: 'md' }} color="gray.900">
                  Nenhum agendamento encontrado
                </Heading>
                <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
                  {schedules.length === 0
                    ? 'Ainda não há agendamentos de manutenção cadastrados.'
                    : 'Nenhum agendamento corresponde aos filtros aplicados.'}
                </Text>
                {schedules.length === 0 && (
                  <Link href="/maintenance-schedules/new">
                    <Button colorScheme="blue" size={{ base: 'sm', md: 'md' }}>
                      Criar Primeiro Agendamento
                    </Button>
                  </Link>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          filteredSchedules.map((schedule) => {
            const nextTaskDate = getNextTaskDate(schedule);
            const pendingTasksCount = schedule.tasks.filter((task) => task.status === 'PENDING').length;
            const { status, color, days } = getNextMaintenanceStatus(schedule);

            return (
              <Card key={schedule.id} shadow="sm" _hover={{ shadow: 'md' }} transition="shadow 0.15s">
                <CardBody p={{ base: 3, md: 4 }}>
                  <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align="start" spacing={3}>
                    <Box flex={1} minW={0}>
                      <Stack
                        direction={{ base: 'column', sm: 'row' }}
                        spacing={2}
                        mb={2}
                        align={{ base: 'start', sm: 'center' }}
                      >
                        <Heading size={{ base: 'sm', md: 'md' }} color="gray.900" noOfLines={1}>
                          {schedule.inventory.name}
                        </Heading>
                        <HStack spacing={2} flexWrap="wrap">
                          <Badge colorScheme={schedule.active ? 'green' : 'gray'} size={{ base: 'sm', md: 'md' }}>
                            {schedule.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" size={{ base: 'sm', md: 'md' }}>
                            {getTypeLabel(schedule.type)}
                          </Badge>
                        </HStack>
                      </Stack>

                      <Stack
                        direction={{ base: 'column', md: 'row' }}
                        spacing={{ base: 1, md: 3 }}
                        fontSize="xs"
                        color="gray.600"
                        mb={2}
                      >
                        <HStack>
                          <Text fontWeight="medium">Equipamento:</Text>
                          <Text noOfLines={1}>{schedule.inventory.serial_number}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium">Técnico:</Text>
                          <Text noOfLines={1}>{schedule.technician.name}</Text>
                        </HStack>
                        <HStack>
                          <Text fontWeight="medium">Intervalo:</Text>
                          <Text>{schedule.interval_days} dias</Text>
                        </HStack>
                      </Stack>

                      {nextTaskDate && (
                        <HStack spacing={2} mt={2} fontSize="xs" flexWrap="wrap">
                          <Calendar
                            size={isMobile ? 14 : 16}
                            color={
                              color === 'red'
                                ? 'red.600'
                                : color === 'orange'
                                  ? 'orange.600'
                                  : color === 'yellow'
                                    ? 'yellow.600'
                                    : 'blue.600'
                            }
                          />
                          <Text
                            color={
                              color === 'red'
                                ? 'red.600'
                                : color === 'orange'
                                  ? 'orange.600'
                                  : color === 'yellow'
                                    ? 'yellow.600'
                                    : 'blue.600'
                            }
                            fontWeight="medium"
                            noOfLines={1}
                          >
                            Próxima: {format(new Date(nextTaskDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </Text>
                          {status !== 'no-date' && (
                            <Badge
                              colorScheme={color}
                              variant={status === 'overdue' ? 'solid' : 'subtle'}
                              fontSize="xs"
                              size="sm"
                            >
                              {status === 'overdue' && `${days}d atrasado`}
                              {status === 'urgent' && `${days}d`}
                              {status === 'soon' && `${days}d`}
                              {status === 'normal' && `${days}d`}
                            </Badge>
                          )}
                        </HStack>
                      )}

                      <HStack spacing={3} mt={1} fontSize="xs" color="gray.600" flexWrap="wrap">
                        <HStack>
                          <Clock size={isMobile ? 12 : 14} />
                          <Text>Pendentes: {pendingTasksCount}</Text>
                        </HStack>
                        {schedule.tasks.length > 0 && (
                          <HStack>
                            <Text>Total: {schedule.tasks.length}</Text>
                          </HStack>
                        )}
                      </HStack>

                      {schedule.notes && (
                        <Text color="gray.600" mt={2} fontSize="xs" noOfLines={2}>
                          <Text as="span" fontWeight="medium">
                            Observações:
                          </Text>{' '}
                          {schedule.notes}
                        </Text>
                      )}
                    </Box>

                    <Stack direction={{ base: 'row', md: 'column' }} spacing={2} w={{ base: 'full', md: 'auto' }} flexShrink={0}>
                      <Link href={`/maintenance-schedules/${schedule.id}`}>
                        <Button variant="outline" size="sm" w={{ base: 'full', md: 'auto' }}>
                          Detalhes
                        </Button>
                      </Link>
                      <Link href={`/maintenance-schedules/${schedule.id}/edit`}>
                        <Button variant="outline" size="sm" w={{ base: 'full', md: 'auto' }}>
                          Editar
                        </Button>
                      </Link>
                    </Stack>
                  </Stack>
                </CardBody>
              </Card>
            );
          })
        )}
      </VStack>
    </VStack>
  );
}
