'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Grid,
  useColorModeValue,
  Spinner,
  Center,
  Flex,
  useToast,
} from '@chakra-ui/react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  ListTodo,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export interface MaintenanceTask {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  completed_at?: string;
  created_at: string;
  schedule: {
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
  };
}

export function MaintenanceTasksPanel() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewFilter, setViewFilter] = useState('all');
  const toast = useToast();
  const router = useRouter();

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

  const fetchTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/');
        return;
      }

      let endpoint = '/api/tasks';
      if (viewFilter === 'upcoming') {
        endpoint = '/api/tasks/upcoming?days=30';
      } else if (viewFilter === 'overdue') {
        endpoint = '/api/tasks/overdue';
      }

      const response = await fetch(endpoint, {
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
        setTasks(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  }, [router, viewFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleMarkAsCompleted = async (taskId: string) => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Tarefa marcada como concluída!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await fetchTasks();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro!',
          description: error.error || 'Erro ao marcar tarefa como concluída',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro ao marcar tarefa como concluída:', error);
      toast({
        title: 'Erro!',
        description: 'Erro ao marcar tarefa como concluída',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.schedule.inventory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.schedule.inventory.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.schedule.technician.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || task.status === statusFilter;

    return matchesSearch && matchesStatus;
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

  const getStatusBadge = (task: MaintenanceTask) => {
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const isOverdue = isBefore(dueDate, today) && task.status === 'PENDING';
    const isDueSoon =
      isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 7)) && task.status === 'PENDING';

    if (task.status === 'COMPLETED') {
      return (
        <Badge colorScheme="green" variant="solid">
          Concluída
        </Badge>
      );
    }
    if (isOverdue) {
      return (
        <Badge colorScheme="red" variant="solid">
          Atrasada
        </Badge>
      );
    }
    if (isDueSoon) {
      return (
        <Badge colorScheme="yellow" variant="solid">
          Próxima
        </Badge>
      );
    }
    return (
      <Badge variant="outline" colorScheme="blue">
        Pendente
      </Badge>
    );
  };

  const getPriorityIcon = (task: MaintenanceTask) => {
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const isOverdue = isBefore(dueDate, today) && task.status === 'PENDING';
    const isDueSoon =
      isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 3)) && task.status === 'PENDING';

    if (isOverdue) {
      return <AlertTriangle size={18} color={dangerColor} />;
    }
    if (isDueSoon) {
      return <Clock size={18} color={warningColor} />;
    }
    return <Calendar size={18} color={iconColor} />;
  };

  if (loading) {
    return (
      <Center py={8}>
        <VStack spacing={2}>
          <Spinner size="lg" color={iconColor} thickness="3px" />
          <Text color={textSecondary} fontSize="sm">
            Carregando tarefas...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
        <CardBody p={{ base: 3, md: 4 }}>
          <Flex
            gap={2}
            flexWrap="wrap"
            align={{ base: 'stretch', md: 'flex-end' }}
            direction={{ base: 'column', md: 'row' }}
          >
            <Box position="relative" flex={{ md: '1 1 200px' }} minW={{ md: '160px' }}>
              <Input
                placeholder="Buscar tarefa, equipamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                pl={9}
                size="sm"
                bg={inputBg}
                borderColor={inputBorder}
                _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
              />
              <Box position="absolute" left={2.5} top="50%" transform="translateY(-50%)" color={textSecondary}>
                <Search size={14} />
              </Box>
            </Box>
            <Select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              size="sm"
              bg={inputBg}
              borderColor={inputBorder}
              flex={{ md: '0 1 160px' }}
              maxW={{ base: 'full', md: '180px' }}
            >
              <option value="all">Todas</option>
              <option value="upcoming">Próx. 30 dias</option>
              <option value="overdue">Atrasadas</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="sm"
              bg={inputBg}
              borderColor={inputBorder}
              flex={{ md: '0 1 130px' }}
              maxW={{ base: 'full', md: '140px' }}
            >
              <option value="">Status</option>
              <option value="PENDING">Pendente</option>
              <option value="COMPLETED">Concluída</option>
            </Select>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter size={16} />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              colorScheme="blue"
              flexShrink={0}
            >
              Limpar
            </Button>
            <Box flex={{ base: '1 1 100%', md: '0 0 auto' }} w={{ base: 'full', md: 'auto' }} ml={{ md: 'auto' }}>
              <Link href="/maintenance-schedules/new">
                <Button colorScheme="blue" size="sm" leftIcon={<Plus size={16} />} w={{ base: 'full', md: 'auto' }}>
                  Novo agendamento
                </Button>
              </Link>
            </Box>
          </Flex>
        </CardBody>
      </Card>

      <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2}>
        <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
          <CardBody py={3} px={3}>
            <Flex align="center" justify="space-between" gap={2}>
              <Box minW={0}>
                <Text fontSize="xs" fontWeight="medium" color={textSecondary} mb={0}>
                  Total
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={textColor} lineHeight="shorter">
                  {tasks.length}
                </Text>
              </Box>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, blue.500, purple.500)" color="white" flexShrink={0}>
                <ListTodo size={20} />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
          <CardBody py={3} px={3}>
            <Flex align="center" justify="space-between" gap={2}>
              <Box minW={0}>
                <Text fontSize="xs" fontWeight="medium" color={textSecondary} mb={0}>
                  Pendentes
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={warningColor} lineHeight="shorter">
                  {tasks.filter((t) => t.status === 'PENDING').length}
                </Text>
              </Box>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, yellow.500, orange.500)" color="white" flexShrink={0}>
                <Clock size={20} />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
          <CardBody py={3} px={3}>
            <Flex align="center" justify="space-between" gap={2}>
              <Box minW={0}>
                <Text fontSize="xs" fontWeight="medium" color={textSecondary} mb={0}>
                  Atrasadas
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={dangerColor} lineHeight="shorter">
                  {tasks.filter((t) => isBefore(new Date(t.due_date), new Date()) && t.status === 'PENDING').length}
                </Text>
              </Box>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, red.500, pink.500)" color="white" flexShrink={0}>
                <AlertTriangle size={20} />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
          <CardBody py={3} px={3}>
            <Flex align="center" justify="space-between" gap={2}>
              <Box minW={0}>
                <Text fontSize="xs" fontWeight="medium" color={textSecondary} mb={0}>
                  Concluídas
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={successColor} lineHeight="shorter">
                  {tasks.filter((t) => t.status === 'COMPLETED').length}
                </Text>
              </Box>
              <Box p={2} borderRadius="full" bgGradient="linear(to-r, green.500, teal.500)" color="white" flexShrink={0}>
                <CheckCircle size={20} />
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Grid>

      <VStack spacing={3} align="stretch">
        {filteredTasks.length === 0 ? (
          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
            <CardBody py={6} px={4} textAlign="center">
              <VStack spacing={3}>
                <Box p={4} borderRadius="full" bgGradient="linear(to-r, gray.400, gray.500)" color="white">
                  <ListTodo size={32} />
                </Box>
                <VStack spacing={1}>
                  <Heading size="sm" color={textColor} fontWeight="bold">
                    Nenhuma tarefa encontrada
                  </Heading>
                  <Text color={textSecondary} fontSize="sm">
                    {tasks.length === 0
                      ? 'Ainda não há tarefas de manutenção agendadas.'
                      : 'Nenhuma tarefa corresponde aos filtros aplicados.'}
                  </Text>
                </VStack>
                {tasks.length === 0 && (
                  <Link href="/maintenance-schedules/new">
                    <Button colorScheme="blue" size="sm" leftIcon={<Plus size={16} />}>
                      Criar primeiro agendamento
                    </Button>
                  </Link>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const dueDate = new Date(task.due_date);
            const isOverdue = isBefore(dueDate, new Date()) && task.status === 'PENDING';

            return (
              <Card
                key={task.id}
                bg={cardBg}
                borderWidth="1px"
                borderColor={isOverdue ? 'red.300' : cardBorder}
                shadow="sm"
                _hover={{
                  shadow: 'md',
                  borderColor: isOverdue ? 'red.400' : iconColor,
                }}
                transition="box-shadow 0.15s, border-color 0.15s"
              >
                <CardBody p={{ base: 3, md: 4 }}>
                  <Flex justify="space-between" align="start" flexWrap="wrap" gap={3}>
                    <Box flex={1} minW={0}>
                      <HStack spacing={2} mb={2} flexWrap="wrap" align="flex-start">
                        <Box pt={0.5}>{getPriorityIcon(task)}</Box>
                        <VStack align="start" spacing={1} flex={1} minW={0}>
                          <Heading size="sm" color={textColor} fontWeight="bold" noOfLines={2}>
                            {task.title}
                          </Heading>
                          <HStack spacing={2} flexWrap="wrap">
                            {getStatusBadge(task)}
                            <Badge variant="outline" colorScheme="purple" fontSize="xs" px={1.5} py={0}>
                              {getTypeLabel(task.schedule.type)}
                            </Badge>
                          </HStack>
                        </VStack>
                      </HStack>

                      <Grid
                        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                        gap={2}
                        mb={2}
                      >
                        <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                          <Text as="span" fontWeight="semibold" color={textColor}>
                            Equip.:{' '}
                          </Text>
                          {task.schedule.inventory.name}
                        </Text>
                        <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                          <Text as="span" fontWeight="semibold" color={textColor}>
                            Série:{' '}
                          </Text>
                          {task.schedule.inventory.serial_number}
                        </Text>
                        <Text fontSize="xs" color={textSecondary} noOfLines={1}>
                          <Text as="span" fontWeight="semibold" color={textColor}>
                            Téc.:{' '}
                          </Text>
                          {task.schedule.technician.name}
                        </Text>
                        <Text fontSize="xs" noOfLines={1}>
                          <Text as="span" fontWeight="semibold" color={textColor}>
                            Venc.:{' '}
                          </Text>
                          <Text
                            as="span"
                            color={isOverdue ? dangerColor : textSecondary}
                            fontWeight={isOverdue ? 'bold' : 'normal'}
                          >
                            {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </Text>
                        </Text>
                      </Grid>

                      {task.description && (
                        <Text color={textSecondary} fontSize="xs" mb={2} noOfLines={3} lineHeight="short">
                          {task.description}
                        </Text>
                      )}

                      {task.status === 'COMPLETED' && task.completed_at && (
                        <HStack spacing={1} fontSize="xs" color={successColor} bg="green.50" p={2} borderRadius="md">
                          <CheckCircle size={14} />
                          <Text fontWeight="medium" noOfLines={1}>
                            Concluída em {format(new Date(task.completed_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                          </Text>
                        </HStack>
                      )}
                    </Box>

                    <HStack spacing={2} w={{ base: 'full', md: 'auto' }} justify={{ base: 'flex-end', md: 'flex-start' }}>
                      {task.status === 'PENDING' && (
                        <Button
                          onClick={() => handleMarkAsCompleted(task.id)}
                          size="sm"
                          colorScheme="green"
                          leftIcon={<CheckCircle size={16} />}
                        >
                          Concluir
                        </Button>
                      )}
                      <Link href={`/maintenance-schedules/${task.schedule.id}`}>
                        <Button variant="outline" size="sm" colorScheme="blue">
                          Agendamento
                        </Button>
                      </Link>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            );
          })
        )}
      </VStack>
    </VStack>
  );
}
