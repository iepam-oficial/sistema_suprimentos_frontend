'use client';

import { useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  VStack,
  HStack,
  Divider,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  SupportTicket,
  TicketStatus,
  formatTicketDate,
  priorityLabel,
  statusLabel,
  ticketPriorityColorScheme,
  ticketStatusColorScheme,
  ticketTypeColorScheme,
  ticketTypeLabel,
} from './types';

const KANBAN_COLUMNS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

const KANBAN_ACCENT: Record<TicketStatus, string> = {
  OPEN: 'blue.400',
  IN_PROGRESS: 'orange.400',
  RESOLVED: 'green.500',
};

export interface SupportTicketsKanbanProps {
  tickets: SupportTicket[];
  filtersLoading?: boolean;
  onOpenTicket?: (ticket: SupportTicket) => void;
  onDetails?: (ticketId: string) => void;
}

export function SupportTicketsKanban({
  tickets,
  filtersLoading = false,
  onOpenTicket,
  onDetails,
}: SupportTicketsKanbanProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const boardShellBg = useColorModeValue('gray.100', 'blackAlpha.400');
  const boardShellBorder = useColorModeValue('gray.200', 'gray.700');
  const kanbanColumnSurface = useColorModeValue('white', 'gray.800');
  const kanbanCardBg = useColorModeValue('white', 'gray.800');
  const kanbanCardBorder = useColorModeValue('gray.200', 'gray.600');
  const kanbanCardHoverBorder = useColorModeValue('blue.300', 'blue.400');
  const kanbanMuted = useColorModeValue('gray.500', 'gray.400');
  const kanbanTitleColor = useColorModeValue('gray.800', 'gray.100');
  const kanbanLabelColor = useColorModeValue('gray.600', 'gray.300');
  const kanbanEmptyBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.50');

  const ticketsByStatus = useMemo(() => {
    const map: Record<TicketStatus, SupportTicket[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      RESOLVED: [],
    };
    for (const t of tickets) {
      map[t.status].push(t);
    }
    return map;
  }, [tickets]);

  const handleAction = (t: SupportTicket) => {
    if (onOpenTicket) onOpenTicket(t);
    else if (onDetails) onDetails(t.id);
  };

  const renderTicketCard = (t: SupportTicket) => {
    const accent = KANBAN_ACCENT[t.status];
    const interactive = t.status !== 'RESOLVED';
    return (
      <Card
        key={t.id}
        bg={kanbanCardBg}
        borderWidth="1px"
        borderColor={kanbanCardBorder}
        borderLeftWidth="4px"
        borderLeftColor={accent}
        borderRadius="lg"
        boxShadow="sm"
        transition="box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease"
        cursor={interactive ? 'pointer' : 'default'}
        onClick={interactive ? () => handleAction(t) : undefined}
        _hover={
          interactive
            ? {
                boxShadow: 'md',
                borderColor: kanbanCardHoverBorder,
                transform: 'translateY(-2px)',
              }
            : undefined
        }
      >
        <CardBody py={2.5} px={3.5}>
          <VStack align="stretch" spacing={2.5}>
            <Text fontWeight="semibold" fontSize="sm" lineHeight="short" noOfLines={2} color={kanbanTitleColor}>
              {t.subject}
            </Text>
            <HStack flexWrap="wrap" spacing={1.5}>
              <Badge colorScheme={ticketPriorityColorScheme(t.priority)} fontSize="0.65rem" borderRadius="md">
                {priorityLabel(t.priority)}
              </Badge>
              <Badge colorScheme={ticketTypeColorScheme(t.ticket_type ?? 'OTHER')} fontSize="0.65rem" borderRadius="md">
                {ticketTypeLabel(t.ticket_type ?? 'OTHER')}
              </Badge>
            </HStack>
            <VStack align="stretch" spacing={1} fontSize="xs" color={kanbanMuted}>
              <Text noOfLines={1}>
                <Text as="span" fontWeight="medium" color={kanbanLabelColor}>
                  Solicitante
                </Text>{' '}
                {t.requester?.name ?? '—'}
              </Text>
              <Text noOfLines={1}>
                <Text as="span" fontWeight="medium" color={kanbanLabelColor}>
                  Técnico
                </Text>{' '}
                {t.assigned_to?.name ?? '—'}
              </Text>
              <Text fontSize="0.7rem" opacity={0.95}>
                {formatTicketDate(t.created_at)}
              </Text>
            </VStack>
            <Divider borderColor={borderColor} />
            <Box pt={0.5}>
              <Button
                size="sm"
                colorScheme="blue"
                variant="solid"
                width="full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(t);
                }}
              >
                {t.status === 'RESOLVED' ? 'Ver detalhes' : 'Detalhes'}
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box borderRadius="xl" borderWidth="1px" borderColor={boardShellBorder} bg={boardShellBg} p={{ base: 2, md: 3 }}>
      <Box overflowX="auto" opacity={filtersLoading ? 0.6 : 1}>
        <Flex gap={{ base: 3, md: 4 }} alignItems="stretch" minW="min-content">
          {KANBAN_COLUMNS.map((status) => {
            const colTickets = ticketsByStatus[status];
            const accent = KANBAN_ACCENT[status];
            return (
              <Box
                key={status}
                flex="0 0 auto"
                w={{ base: 'min(92vw, 280px)', md: 'clamp(240px, 28vw, 300px)' }}
                minW={{ base: '240px', md: '240px' }}
                maxW="300px"
                bg={kanbanColumnSurface}
                borderWidth="1px"
                borderColor={borderColor}
                borderTopWidth="4px"
                borderTopColor={accent}
                borderRadius="lg"
                boxShadow="sm"
                display="flex"
                flexDirection="column"
                maxH={{ base: '58dvh', md: 'min(78dvh, calc(100dvh - 11rem))' }}
                minH={{ base: 'min(52dvh, 380px)', md: 'min(62dvh, 420px)' }}
              >
                <Box px={3} py={2.5} borderBottomWidth="1px" borderColor={borderColor} flexShrink={0}>
                  <HStack justify="space-between" align="center" spacing={2}>
                    <Text fontWeight="semibold" fontSize="sm" letterSpacing="tight" color={kanbanTitleColor} noOfLines={1}>
                      {statusLabel(status)}
                    </Text>
                    <Badge colorScheme={ticketStatusColorScheme(status)} borderRadius="full" px={2} py={0.5} fontSize="0.7rem">
                      {colTickets.length}
                    </Badge>
                  </HStack>
                </Box>
                <Box flex="1" minH={0} overflowY="auto" px={2.5} py={3}>
                  <VStack spacing={2.5} align="stretch">
                    {colTickets.map((t) => renderTicketCard(t))}
                    {colTickets.length === 0 && (
                      <Box
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor={borderColor}
                        borderRadius="md"
                        py={8}
                        px={2}
                        bg={kanbanEmptyBg}
                      >
                        <Text fontSize="xs" color={kanbanMuted} textAlign="center">
                          Nenhum chamado nesta coluna
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </Box>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}
