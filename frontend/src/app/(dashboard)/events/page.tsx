'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  IconButton,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { EventStatus } from '@/features/events/types';
import { canChangeEventStatus, canCreateEvent } from '@/features/events/types';
import { updateEvent } from '@/features/events/api/eventApi';
import { useEventsFetch } from '@/features/events/hooks/useEventsFetch';
import { eventsOnDate, formatSelectedDateLabel } from '@/features/events/lib/eventPresentation';
import { MonthCalendar } from './components/MonthCalendar';
import { EventCard } from './components/EventCard';
import { EventFormModal } from './components/EventFormModal';
import { EventsEmptyState } from './components/EventsEmptyState';

function getUserRole(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('@ti-assistant:user');
    if (!raw) return '';
    const user = JSON.parse(raw) as { role?: string };
    return user.role ?? '';
  } catch {
    return '';
  }
}

export default function EventsPage() {
  const { events, setEvents, loading, error, reload, setLoading } = useEventsFetch();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('');
  const toast = useToast();
  const { colorMode } = useColorMode();
  const router = useRouter();

  const panelBg = useColorModeValue(
    'rgba(255, 255, 255, 0.5)',
    'rgba(45, 55, 72, 0.5)'
  );
  const panelBorder = useColorModeValue(
    'rgba(0, 0, 0, 0.1)',
    'rgba(255, 255, 255, 0.1)'
  );
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorText = useColorModeValue('red.700', 'red.200');

  const canChangeStatus = canChangeEventStatus(userRole);
  const canCreate = canCreateEvent(userRole);

  const dayEvents = useMemo(
    () => eventsOnDate(events, selectedDate),
    [events, selectedDate]
  );

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const handleStatusChange = async (eventId: string, status: EventStatus) => {
    const previous = events.find((e) => e.id === eventId);
    if (!previous || previous.status === status) return;

    setEvents((list) =>
      list.map((e) => (e.id === eventId ? { ...e, status } : e))
    );
    setStatusUpdatingId(eventId);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');

      const updated = await updateEvent(token, eventId, { status });
      setEvents((list) =>
        list.map((e) => (e.id === eventId ? { ...e, ...updated } : e))
      );
    } catch (e) {
      setEvents((list) =>
        list.map((item) => (item.id === eventId ? previous : item))
      );
      toast({
        title: 'Erro',
        description:
          e instanceof Error ? e.message : 'Não foi possível atualizar o status.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Box p={8}>
        <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
          Carregando eventos...
        </Text>
      </Box>
    );
  }

  return (
    <Box w="full" h="full" py={{ base: 2, md: 4 }} px={{ base: 3, md: 8 }}>
      <VStack
        spacing={4}
        align="stretch"
        bg={panelBg}
        backdropFilter="blur(12px)"
        p={{ base: 3, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={panelBorder}
        h="full"
      >
        <Flex justify="space-between" align="center">
          <Heading size="lg" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
            Gestão de Eventos
          </Heading>
          {canCreate ? (
            <IconButton
              aria-label="Novo evento"
              icon={<Plus size={20} />}
              colorScheme="blue"
              borderRadius="full"
              size="sm"
              onClick={() => setModalOpen(true)}
            />
          ) : null}
        </Flex>

        {error ? (
          <Box
            mb={2}
            p={3}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="red.200"
            bg={errorBg}
          >
            <Text fontSize="sm" color={errorText}>
              {error}
            </Text>
            <Text
              as="button"
              mt={2}
              fontSize="sm"
              fontWeight="semibold"
              color="blue.500"
              onClick={() => {
                setLoading(true);
                reload();
              }}
            >
              Tentar novamente
            </Text>
          </Box>
        ) : null}

        <MonthCalendar
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          events={events}
          onMonthChange={setVisibleMonth}
          onSelectDate={setSelectedDate}
        />

        <Flex mb={3} align="center" justify="space-between" px={1}>
          <Text fontSize="sm" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
            Eventos em {formatSelectedDateLabel(selectedDate)}
          </Text>
          <Badge
            borderRadius="full"
            px={2}
            py={0.5}
            fontSize="xs"
            colorScheme="gray"
          >
            {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
          </Badge>
        </Flex>

        {dayEvents.length === 0 ? (
          <EventsEmptyState canCreate={canCreate} />
        ) : (
          dayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canChangeStatus={canChangeStatus}
              statusUpdating={statusUpdatingId === event.id}
              onStatusChange={(status) => handleStatusChange(event.id, status)}
              onOpenDetail={() => router.push(`/events/${event.id}`)}
            />
          ))
        )}
      </VStack>

      {canCreate ? (
        <EventFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={reload}
        />
      ) : null}
    </Box>
  );
}
