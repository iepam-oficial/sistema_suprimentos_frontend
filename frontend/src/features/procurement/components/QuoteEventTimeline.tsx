'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Center,
  Heading,
  HStack,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { ProcurementQuoteInviteDTO } from '@ti-assistant/contracts';
import {
  fetchProcurementQuoteEvents,
  type ProcurementQuoteEventDTO,
} from '../api/procurementQuoteApi';

interface QuoteEventTimelineProps {
  quoteId: string;
  invites: ProcurementQuoteInviteDTO[];
}

const EVENT_LABELS: Record<string, string> = {
  EMAIL_SENT: 'E-mail enviado',
  EMAIL_OPENED: 'E-mail aberto',
  PORTAL_ACCESSED: 'Portal acessado',
  PROPOSAL_SUBMITTED: 'Proposta enviada',
  INVITE_DECLINED: 'Convite recusado',
  QUOTE_CLOSED: 'Cotação encerrada',
  QUOTE_APPROVED: 'Cotação aprovada',
};

const EVENT_COLORS: Record<string, string> = {
  EMAIL_SENT: 'blue',
  EMAIL_OPENED: 'cyan',
  PORTAL_ACCESSED: 'teal',
  PROPOSAL_SUBMITTED: 'green',
  INVITE_DECLINED: 'red',
  QUOTE_CLOSED: 'purple',
  QUOTE_APPROVED: 'green',
};

function eventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

function eventColor(eventType: string): string {
  return EVENT_COLORS[eventType] ?? 'gray';
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('pt-BR');
}

function groupEventsByInvite(
  events: ProcurementQuoteEventDTO[],
  invites: ProcurementQuoteInviteDTO[]
): Array<{ key: string; title: string; events: ProcurementQuoteEventDTO[] }> {
  const inviteMap = new Map(invites.map((invite) => [invite.id, invite]));
  const byInvite = new Map<string, ProcurementQuoteEventDTO[]>();
  const quoteLevel: ProcurementQuoteEventDTO[] = [];

  for (const event of events) {
    if (event.invite_id) {
      const list = byInvite.get(event.invite_id) ?? [];
      list.push(event);
      byInvite.set(event.invite_id, list);
    } else {
      quoteLevel.push(event);
    }
  }

  const groups: Array<{ key: string; title: string; events: ProcurementQuoteEventDTO[] }> = [];

  for (const invite of invites) {
    const inviteEvents = byInvite.get(invite.id);
    if (inviteEvents?.length) {
      groups.push({
        key: invite.id,
        title: invite.supplier?.name ?? 'Fornecedor',
        events: inviteEvents,
      });
    }
    byInvite.delete(invite.id);
  }

  for (const [inviteId, orphanEvents] of byInvite) {
    const invite = inviteMap.get(inviteId);
    groups.push({
      key: inviteId,
      title: invite?.supplier?.name ?? 'Fornecedor',
      events: orphanEvents,
    });
  }

  if (quoteLevel.length > 0) {
    groups.push({
      key: 'quote-level',
      title: 'Cotação',
      events: quoteLevel,
    });
  }

  return groups;
}

function TimelineEventItem({
  event,
  isLast,
}: {
  event: ProcurementQuoteEventDTO;
  isLast: boolean;
}) {
  const lineColor = useColorModeValue('gray.200', 'gray.600');
  const dotBorder = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <HStack align="flex-start" spacing={3} position="relative" pl={1}>
      <Box position="relative" pt={1}>
        <Box
          w="10px"
          h="10px"
          borderRadius="full"
          bg={`${eventColor(event.event_type)}.400`}
          borderWidth="2px"
          borderColor={dotBorder}
          zIndex={1}
        />
        {!isLast && (
          <Box
            position="absolute"
            top="18px"
            left="4px"
            w="2px"
            h="calc(100% + 8px)"
            bg={lineColor}
          />
        )}
      </Box>
      <VStack align="stretch" spacing={1} pb={4} flex={1}>
        <HStack flexWrap="wrap" gap={2}>
          <Badge colorScheme={eventColor(event.event_type)}>{eventLabel(event.event_type)}</Badge>
          <Text fontSize="xs" color={mutedColor}>
            {formatTimestamp(event.created_at)}
          </Text>
        </HStack>
        {event.event_type === 'INVITE_DECLINED' &&
          typeof event.metadata === 'object' &&
          event.metadata !== null &&
          'reason' in event.metadata &&
          typeof (event.metadata as { reason?: unknown }).reason === 'string' && (
            <Text fontSize="sm" color={textColor}>
              Motivo: {(event.metadata as { reason: string }).reason}
            </Text>
          )}
      </VStack>
    </HStack>
  );
}

function SupplierTimelineGroup({
  title,
  events,
}: {
  title: string;
  events: ProcurementQuoteEventDTO[];
}) {
  const headingColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.100', 'gray.600');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
      <Heading size="xs" mb={3} color={headingColor}>
        {title}
      </Heading>
      <Box>
        {events.map((event, index) => (
          <TimelineEventItem
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
}

export function QuoteEventTimeline({ quoteId, invites }: QuoteEventTimelineProps) {
  const toast = useToast();
  const [events, setEvents] = useState<ProcurementQuoteEventDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');

  const loadEvents = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchProcurementQuoteEvents(token, quoteId);
      setEvents(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar timeline',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [quoteId, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const groups = useMemo(() => groupEventsByInvite(events, invites), [events, invites]);

  if (loading) {
    return (
      <Center py={6}>
        <Spinner size="md" />
      </Center>
    );
  }

  return (
    <Box>
      <Heading size="sm" mb={3} color={headingColor}>
        Timeline de eventos
      </Heading>

      {groups.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>
          Nenhum evento registrado ainda.
        </Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {groups.map((group) => (
            <SupplierTimelineGroup
              key={group.key}
              title={group.title}
              events={group.events}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}
