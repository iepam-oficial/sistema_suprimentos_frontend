'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Flex,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Select,
  HStack,
  VStack,
  Divider,
  FormLabel,
  Wrap,
  WrapItem,
  useColorModeValue,
  useBreakpointValue,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { useSupportTicketsFetch } from './useSupportTicketsFetch';
import { SupportTicketsKanban } from './SupportTicketsKanban';
import {
  canCreateSupportTicket,
  canUseSupportTicketsKanban,
  formatTicketDate,
  priorityLabel,
  statusLabel,
  ticketPriorityColorScheme,
  ticketStatusColorScheme,
  ticketTypeColorScheme,
  ticketTypeLabel,
  SupportTicket,
} from './types';

export function SupportTicketsLegacyListView() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const router = useRouter();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const listPanelBg = useColorModeValue('gray.100', 'blackAlpha.400');
  const listPanelBorder = useColorModeValue('gray.200', 'gray.700');
  const listCardBg = useColorModeValue('white', 'gray.800');
  const listCardBorder = useColorModeValue('gray.200', 'gray.600');
  const listCardHoverBorder = useColorModeValue('blue.200', 'blue.400');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowHover = useColorModeValue('blue.50', 'whiteAlpha.50');
  const tableCellMuted = useColorModeValue('gray.600', 'gray.300');
  const kanbanMuted = useColorModeValue('gray.500', 'gray.400');
  const kanbanTitleColor = useColorModeValue('gray.800', 'gray.100');
  const kanbanLabelColor = useColorModeValue('gray.600', 'gray.300');
  const kanbanEmptyBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.50');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const KANBAN_ACCENT = {
    OPEN: 'blue.400',
    IN_PROGRESS: 'orange.400',
    RESOLVED: 'green.500',
  } as const;

  const { tickets, initialLoading, filtersLoading, error, userRole } = useSupportTicketsFetch({
    statusFilter,
    priorityFilter,
    viewMode,
  });

  const canKanban = !!userRole && canUseSupportTicketsKanban(userRole);
  const showBoard = canKanban && viewMode === 'board';
  const canCreate = !!userRole && canCreateSupportTicket(userRole);

  const renderTicketActions = (t: SupportTicket, layout: 'list' | 'board' = 'list') => {
    if (t.status === 'RESOLVED') {
      return (
        <Text fontSize="sm" color="gray.500" textAlign={layout === 'board' ? 'center' : 'start'}>
          —
        </Text>
      );
    }
    return (
      <Button
        size="sm"
        colorScheme="blue"
        variant={layout === 'board' ? 'solid' : 'outline'}
        width={layout === 'board' ? 'full' : undefined}
        onClick={() => router.push(`/support-tickets/${t.id}`)}
      >
        Detalhes
      </Button>
    );
  };

  const renderListMobileTicketCard = (t: SupportTicket) => {
    const accent = KANBAN_ACCENT[t.status];
    const interactive = t.status !== 'RESOLVED';
    return (
      <Card
        key={t.id}
        bg={listCardBg}
        borderWidth="1px"
        borderColor={listCardBorder}
        borderLeftWidth="4px"
        borderLeftColor={accent}
        borderRadius="lg"
        boxShadow="sm"
        transition="box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease"
        _hover={
          interactive
            ? { boxShadow: 'md', borderColor: listCardHoverBorder, transform: 'translateY(-2px)' }
            : undefined
        }
      >
        <CardBody py={2.5} px={3.5}>
          <VStack align="stretch" spacing={2.5}>
            <Text fontWeight="semibold" fontSize="sm" lineHeight="short" noOfLines={3} color={kanbanTitleColor}>
              {t.subject}
            </Text>
            <HStack flexWrap="wrap" spacing={1.5}>
              <Badge colorScheme={ticketStatusColorScheme(t.status)} fontSize="0.65rem" borderRadius="md">
                {statusLabel(t.status)}
              </Badge>
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
            <Box pt={0.5}>{renderTicketActions(t, 'list')}</Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box
      as="main"
      w="100%"
      maxW="1600px"
      mx="auto"
      px={{ base: 2, sm: 3, md: 4 }}
      pt={{ base: 2, md: 3 }}
      pb={{ base: 4, md: 5 }}
      bg={cardBg}
    >
      <Flex
        flexDir={{ base: 'column', sm: 'row' }}
        align={{ base: 'stretch', sm: 'center' }}
        justify="space-between"
        gap={3}
        mb={3}
        flexWrap="wrap"
      >
        <Heading size={{ base: 'md', md: 'lg' }} lineHeight="shorter">
          Chamados
        </Heading>
        <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', sm: 'flex-end' }}>
          {canCreate && (
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              colorScheme="blue"
              onClick={() => router.push('/support-tickets/new')}
            >
              Novo chamado
            </Button>
          )}
          {canKanban && (
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                leftIcon={<List size={15} />}
                variant={viewMode === 'list' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
              <Button
                leftIcon={<LayoutGrid size={15} />}
                variant={viewMode === 'board' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setViewMode('board')}
              >
                Quadro
              </Button>
            </ButtonGroup>
          )}
        </HStack>
      </Flex>

      <Wrap spacing={{ base: 2, md: 3 }} spacingY={2} mb={showBoard ? 1.5 : 2} align="flex-end">
        <WrapItem>
          <Box minW={{ base: 'min(100%, 160px)', sm: '170px' }} maxW="220px">
            <FormLabel fontSize="xs" mb={1} fontWeight="medium" color={tableCellMuted}>
              Status
            </FormLabel>
            <Select
              size="sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              isDisabled={initialLoading || showBoard}
            >
              <option value="">Todos</option>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="RESOLVED">Resolvido</option>
            </Select>
          </Box>
        </WrapItem>
        <WrapItem>
          <Box minW={{ base: 'min(100%, 160px)', sm: '170px' }} maxW="220px">
            <FormLabel fontSize="xs" mb={1} fontWeight="medium" color={tableCellMuted}>
              Prioridade
            </FormLabel>
            <Select
              size="sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              isDisabled={initialLoading}
            >
              <option value="">Todas</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </Select>
          </Box>
        </WrapItem>
        <WrapItem display="flex" alignItems="center" h="32px" alignSelf="flex-end">
          {filtersLoading && <Spinner size="sm" />}
        </WrapItem>
      </Wrap>

      {showBoard && (
        <Text fontSize="xs" color={kanbanMuted} mb={2} lineHeight="short">
          No quadro, todos os estados são mostrados. Use o filtro de prioridade para refinar.
        </Text>
      )}

      {initialLoading ? (
        <Flex justify="center" align="center" minH="min(40dvh, 200px)">
          <Spinner size="lg" />
        </Flex>
      ) : (
        <>
          {error && (
            <Text color="red.500" mb={2} fontSize="sm">
              {error}
            </Text>
          )}
          {showBoard ? (
            <>
              <SupportTicketsKanban
                tickets={tickets}
                filtersLoading={filtersLoading}
                onDetails={(id) => router.push(`/support-tickets/${id}`)}
              />
              {tickets.length === 0 && (
                <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                  Nenhum chamado encontrado.
                </Text>
              )}
            </>
          ) : isMobile ? (
            <Box borderRadius="xl" borderWidth="1px" borderColor={listPanelBorder} bg={listPanelBg} p={{ base: 2, sm: 3 }}>
              <VStack spacing={3} align="stretch">
                {tickets.map((t) => renderListMobileTicketCard(t))}
                {tickets.length === 0 && (
                  <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} borderRadius="md" py={8} px={2} bg={kanbanEmptyBg}>
                    <Text fontSize="sm" color={kanbanMuted} textAlign="center">
                      Nenhum chamado encontrado.
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          ) : (
            <Box borderRadius="xl" borderWidth="1px" borderColor={listPanelBorder} bg={listPanelBg} p={{ base: 1, md: 2 }}>
              <TableContainer overflowX="auto" opacity={filtersLoading ? 0.6 : 1}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr bg={tableHeaderBg}>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none">
                        Assunto
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none" whiteSpace="nowrap">
                        Status
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none" whiteSpace="nowrap">
                        Prioridade
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none">
                        Tipo
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none">
                        Solicitante
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none">
                        Técnico
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none" whiteSpace="nowrap">
                        Criado em
                      </Th>
                      <Th py={2} px={2} fontSize="xs" fontWeight="semibold" color={tableCellMuted} textTransform="none" w="108px">
                        Ações
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tickets.map((t) => (
                      <Tr key={t.id} _hover={{ bg: tableRowHover }} transition="background 0.15s ease" borderBottomWidth="1px" borderColor={borderColor}>
                        <Td py={2} px={2} maxW="260px" verticalAlign="middle">
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={2} color={kanbanTitleColor}>
                            {t.subject}
                          </Text>
                        </Td>
                        <Td py={2} px={2} verticalAlign="middle">
                          <Badge colorScheme={ticketStatusColorScheme(t.status)} fontSize="0.65rem" borderRadius="md">
                            {statusLabel(t.status)}
                          </Badge>
                        </Td>
                        <Td py={2} px={2} verticalAlign="middle">
                          <Badge colorScheme={ticketPriorityColorScheme(t.priority)} fontSize="0.65rem" borderRadius="md">
                            {priorityLabel(t.priority)}
                          </Badge>
                        </Td>
                        <Td py={2} px={2} verticalAlign="middle">
                          <Badge colorScheme={ticketTypeColorScheme(t.ticket_type ?? 'OTHER')} fontSize="0.65rem" borderRadius="md">
                            {ticketTypeLabel(t.ticket_type ?? 'OTHER')}
                          </Badge>
                        </Td>
                        <Td py={2} px={2} fontSize="sm" color={tableCellMuted} verticalAlign="middle" maxW="160px">
                          <Text noOfLines={2}>{t.requester?.name ?? '—'}</Text>
                        </Td>
                        <Td py={2} px={2} fontSize="sm" color={tableCellMuted} verticalAlign="middle" maxW="160px">
                          <Text noOfLines={2}>{t.assigned_to?.name ?? '—'}</Text>
                        </Td>
                        <Td py={2} px={2} fontSize="xs" color={tableCellMuted} whiteSpace="nowrap" verticalAlign="middle">
                          {formatTicketDate(t.created_at)}
                        </Td>
                        <Td py={2} px={2} verticalAlign="middle">
                          {renderTicketActions(t, 'list')}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              {tickets.length === 0 && (
                <Text mt={2} px={2} pb={3} fontSize="sm" color="gray.500" textAlign="center">
                  Nenhum chamado encontrado.
                </Text>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
