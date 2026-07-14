'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Center,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  HStack,
  Select,
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
import { usePollingRefresh } from '../hooks/usePollingRefresh';
import { buildSupplierTimelineEvents } from '../lib/quoteTimeline';

interface QuoteTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  invites: ProcurementQuoteInviteDTO[];
  pollingEnabled?: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  EMAIL_SENT: 'E-mail enviado',
  EMAIL_DELIVERED: 'E-mail entregue',
  PORTAL_ACCESSED: 'Último acesso ao portal',
};

const EVENT_COLORS: Record<string, string> = {
  EMAIL_SENT: 'blue',
  EMAIL_DELIVERED: 'cyan',
  PORTAL_ACCESSED: 'teal',
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

function TimelineEventItem({
  event,
  isLast,
}: {
  event: ProcurementQuoteEventDTO;
  isLast: boolean;
}) {
  const lineColor = useColorModeValue('gray.200', 'gray.600');
  const dotBorder = useColorModeValue('white', 'gray.700');
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
          <Badge colorScheme={eventColor(event.event_type)}>
            {eventLabel(event.event_type)}
          </Badge>
          <Text fontSize="xs" color={mutedColor}>
            {formatTimestamp(event.created_at)}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  );
}

export function QuoteTimelineDrawer({
  isOpen,
  onClose,
  quoteId,
  invites,
  pollingEnabled = true,
}: QuoteTimelineDrawerProps) {
  const toast = useToast();
  const [events, setEvents] = useState<ProcurementQuoteEventDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState<string>('');

  const drawerBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const formLabelColor = useColorModeValue('gray.800', 'white');

  const loadEvents = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    try {
      if (!silent) setLoading(true);
      const data = await fetchProcurementQuoteEvents(
        token,
        quoteId,
        silent ? { polling: true } : undefined,
      );
      setEvents(data);
    } catch (err) {
      if (!silent) {
        toast({
          title: 'Erro ao carregar timeline',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [quoteId, toast]);

  useEffect(() => {
    if (isOpen) {
      void loadEvents();
    }
  }, [isOpen, loadEvents]);

  usePollingRefresh({
    enabled: isOpen && pollingEnabled,
    onTick: () => {
      void loadEvents({ silent: true });
    },
  });

  useEffect(() => {
    if (invites.length > 0 && !selectedInviteId) {
      setSelectedInviteId(invites[0].id);
    }
  }, [invites, selectedInviteId]);

  const filteredEvents = useMemo(() => {
    if (!selectedInviteId) return [];
    return buildSupplierTimelineEvents(events, selectedInviteId);
  }, [events, selectedInviteId]);

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" color={headerColor}>
          Linha do tempo
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel color={formLabelColor}>Fornecedor</FormLabel>
              <Select
                value={selectedInviteId}
                onChange={(e) => setSelectedInviteId(e.target.value)}
                size="sm"
              >
                {invites.map((invite) => (
                  <option key={invite.id} value={invite.id}>
                    {invite.supplier?.name ?? 'Fornecedor'}
                  </option>
                ))}
              </Select>
            </FormControl>

            {loading ? (
              <Center py={8}>
                <Spinner size="md" />
              </Center>
            ) : filteredEvents.length === 0 ? (
              <Box
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={4}
              >
                <Text fontSize="sm" color={mutedColor}>
                  Nenhum evento registrado
                </Text>
              </Box>
            ) : (
              <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
                {filteredEvents.map((event, index) => (
                  <TimelineEventItem
                    key={event.id}
                    event={event}
                    isLast={index === filteredEvents.length - 1}
                  />
                ))}
              </Box>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
