'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  HStack,
  Heading,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { CalendarDays } from 'lucide-react';
import type { ManagerOpsCalendarEventDTO } from '@ti-assistant/contracts';
import { ManagerOpsCalendarEventType } from '@ti-assistant/contracts';

interface ManagerOpsCalendarProps {
  events: ManagerOpsCalendarEventDTO[];
  loading: boolean;
}

const EVENT_TYPE_COLOR_SCHEME: Record<ManagerOpsCalendarEventType, string> = {
  [ManagerOpsCalendarEventType.BATCH_EXPIRY]: 'red',
  [ManagerOpsCalendarEventType.SUPPLY_REQUEST_DEADLINE]: 'blue',
  [ManagerOpsCalendarEventType.QUOTE_DEADLINE]: 'purple',
  [ManagerOpsCalendarEventType.PURCHASE_ORDER_EXPIRY]: 'orange',
  [ManagerOpsCalendarEventType.EVENT]: 'gray',
};

const EVENT_TYPE_LABEL: Record<ManagerOpsCalendarEventType, string> = {
  [ManagerOpsCalendarEventType.BATCH_EXPIRY]: 'Vencimento de Lote',
  [ManagerOpsCalendarEventType.SUPPLY_REQUEST_DEADLINE]: 'Prazo de Requisição',
  [ManagerOpsCalendarEventType.QUOTE_DEADLINE]: 'Prazo de Cotação',
  [ManagerOpsCalendarEventType.PURCHASE_ORDER_EXPIRY]: 'Vencimento de Pedido',
  [ManagerOpsCalendarEventType.EVENT]: 'Evento',
};

function formatAt(at: string): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return at;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function CalendarEventItem({
  event,
  onClick,
}: {
  event: ManagerOpsCalendarEventDTO;
  onClick?: () => void;
}) {
  const itemBorder = useColorModeValue('gray.200', 'gray.700');
  const itemBg = useColorModeValue('white', 'gray.800');
  const itemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const titleColor = useColorModeValue('gray.800', 'white');
  const dateColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box
      borderWidth="1px"
      borderColor={itemBorder}
      borderRadius="md"
      bg={itemBg}
      p={3}
      cursor={event.href ? 'pointer' : 'default'}
      transition="background 0.15s"
      _hover={event.href ? { bg: itemHoverBg } : undefined}
      onClick={event.href ? onClick : undefined}
    >
      <HStack justify="space-between" align="start" mb={1}>
        <Text fontSize="sm" fontWeight="semibold" color={titleColor} noOfLines={1}>
          {event.title}
        </Text>
        <Badge colorScheme={EVENT_TYPE_COLOR_SCHEME[event.type]} fontSize="9px" flexShrink={0}>
          {EVENT_TYPE_LABEL[event.type]}
        </Badge>
      </HStack>
      <Text fontSize="xs" color={dateColor}>
        {formatAt(event.at)}
      </Text>
    </Box>
  );
}

function CalendarSkeleton() {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  return (
    <VStack align="stretch" spacing={2}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
          <Skeleton height="14px" width="70%" mb={2} />
          <Skeleton height="10px" width="40%" />
        </Box>
      ))}
    </VStack>
  );
}

export function ManagerOpsCalendar({ events, loading }: ManagerOpsCalendarProps) {
  const router = useRouter();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
      ),
    [events]
  );

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack spacing={1.5} mb={3}>
        <Box as="span" display="inline-flex" color={iconColor}>
          <CalendarDays size={16} />
        </Box>
        <Heading
          size="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Calendário {sortedEvents.length > 0 ? `(${sortedEvents.length})` : ''}
        </Heading>
      </HStack>

      {loading && sortedEvents.length === 0 ? (
        <CalendarSkeleton />
      ) : sortedEvents.length === 0 ? (
        <Text fontSize="sm" color={labelColor} py={4} textAlign="center">
          Nenhum evento próximo no calendário.
        </Text>
      ) : (
        <VStack
          align="stretch"
          spacing={2}
          maxH={{ base: '360px', md: '480px' }}
          overflowY="auto"
          pr={1}
          sx={{ scrollbarGutter: 'stable' }}
        >
          {sortedEvents.map((event) => (
            <CalendarEventItem
              key={event.id}
              event={event}
              onClick={event.href ? () => router.push(event.href as string) : undefined}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}
