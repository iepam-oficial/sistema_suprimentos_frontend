'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Spinner,
  HStack,
  VStack,
  Card,
  CardBody,
  useColorModeValue,
  useBreakpointValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  Search,
  Ticket,
  FolderOpen,
  Loader,
  CheckCircle2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useSupportTicketsFetch } from './useSupportTicketsFetch';
import { SupportTicketsKanban } from './SupportTicketsKanban';
import { SupportTicketDeskModal } from './SupportTicketDeskModal';
import {
  SupportTicket,
  formatTicketDate,
  priorityLabel,
  statusLabel,
  ticketMatchesSearch,
  ticketPriorityColorScheme,
  ticketStatusColorScheme,
  ticketTypeColorScheme,
  ticketTypeLabel,
  shortTicketId,
} from './types';

type DeskFilter = 'all' | 'open' | 'resolved';

const STAT_ICONS = {
  total: { icon: Ticket, bg: 'blue.50', color: 'blue.600' },
  open: { icon: FolderOpen, bg: 'orange.50', color: 'orange.600' },
  progress: { icon: Loader, bg: 'purple.50', color: 'purple.600' },
  resolved: { icon: CheckCircle2, bg: 'green.50', color: 'green.600' },
};

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: keyof typeof STAT_ICONS;
}) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { icon: Icon, bg, color } = STAT_ICONS[variant];
  const iconBg = useColorModeValue(bg, 'whiteAlpha.100');

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" shadow="sm">
      <CardBody p={5} display="flex" alignItems="center">
        <Flex
          align="center"
          justify="center"
          w={12}
          h={12}
          borderRadius="lg"
          bg={iconBg}
          color={color}
          mr={4}
          flexShrink={0}
        >
          <Icon size={22} />
        </Flex>
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {value}
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
}

export function AdminSupportDeskView() {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deskFilter, setDeskFilter] = useState<DeskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalTicketId, setModalTicketId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowHover = useColorModeValue('blue.50', 'whiteAlpha.50');
  const muted = useColorModeValue('gray.500', 'gray.400');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { tickets, setTickets, initialLoading, filtersLoading, error, userRole } = useSupportTicketsFetch({
    priorityFilter,
    viewMode,
    fetchAllStatuses: true,
  });

  useEffect(() => {
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (userRaw) {
      const u = JSON.parse(userRaw) as { id?: string };
      setUserId(u.id ?? null);
    }
  }, []);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const progress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    return { total: tickets.length, open, progress, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (viewMode === 'list') {
      if (deskFilter === 'open') {
        list = list.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
      } else if (deskFilter === 'resolved') {
        list = list.filter((t) => t.status === 'RESOLVED');
      }
    }
    if (searchQuery.trim()) {
      list = list.filter((t) => ticketMatchesSearch(t, searchQuery));
    }
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [tickets, deskFilter, searchQuery, viewMode]);

  const handleTicketUpdated = (updated: SupportTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTicketDeleted = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setModalTicketId(null);
  };

  const chipActiveBg = useColorModeValue('gray.800', 'gray.100');
  const chipActiveColor = useColorModeValue('white', 'gray.800');
  const chipHoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const emptyIconBg = useColorModeValue('gray.100', 'gray.700');

  const filterChipProps = (active: boolean) => ({
    size: 'sm' as const,
    borderRadius: 'md',
    fontWeight: 'medium' as const,
    variant: active ? 'solid' : 'ghost',
    bg: active ? chipActiveBg : undefined,
    color: active ? chipActiveColor : muted,
    _hover: { bg: active ? undefined : chipHoverBg },
  });

  const pageTitle = viewMode === 'board' ? 'Quadro de chamados' : 'Visão geral dos chamados';

  return (
    <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column">
      <Box
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        px={{ base: 4, md: 6 }}
        py={4}
        shadow="sm"
        flexShrink={0}
      >
        <Flex
          flexDir={{ base: 'column', lg: 'row' }}
          align={{ base: 'stretch', lg: 'center' }}
          justify="space-between"
          gap={4}
          maxW="7xl"
          mx="auto"
          w="full"
        >
          <Heading size="lg" fontWeight="semibold">
            {pageTitle}
          </Heading>
          <HStack spacing={3} flexWrap="wrap" justify={{ base: 'flex-start', lg: 'flex-end' }}>
            <InputGroup size="sm" maxW={{ base: 'full', sm: '280px' }} display={{ base: 'none', sm: 'block' }}>
              <InputLeftElement pointerEvents="none">
                <Search size={16} color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Buscar chamados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
              />
            </InputGroup>
            <Wrap spacing={2} align="center">
              <WrapItem>
                <Select
                  size="sm"
                  maxW="140px"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  isDisabled={initialLoading}
                >
                  <option value="">Prioridade</option>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </Select>
              </WrapItem>
              <WrapItem>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    leftIcon={<List size={14} />}
                    colorScheme="blue"
                    variant={viewMode === 'list' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('list')}
                  >
                    Painel
                  </Button>
                  <Button
                    leftIcon={<LayoutGrid size={14} />}
                    colorScheme="blue"
                    variant={viewMode === 'board' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('board')}
                  >
                    Quadro
                  </Button>
                </ButtonGroup>
              </WrapItem>
              {filtersLoading && (
                <WrapItem>
                  <Spinner size="sm" />
                </WrapItem>
              )}
            </Wrap>
          </HStack>
        </Flex>
        <InputGroup size="sm" mt={3} display={{ base: 'block', sm: 'none' }}>
          <InputLeftElement pointerEvents="none">
            <Search size={16} />
          </InputLeftElement>
          <Input
            placeholder="Buscar chamados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Box>

      <Box flex={1} overflow="auto" px={{ base: 4, md: 6, lg: 8 }} py={6} maxW="7xl" mx="auto" w="full">
        {initialLoading ? (
          <Flex justify="center" align="center" minH="40vh">
            <Spinner size="lg" />
          </Flex>
        ) : (
          <>
            {error && (
              <Text color="red.500" mb={4} fontSize="sm">
                {error}
              </Text>
            )}

            {viewMode === 'list' && (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
                <StatCard label="Total de chamados" value={stats.total} variant="total" />
                <StatCard label="Abertos" value={stats.open} variant="open" />
                <StatCard label="Em andamento" value={stats.progress} variant="progress" />
                <StatCard label="Resolvidos" value={stats.resolved} variant="resolved" />
              </SimpleGrid>
            )}

            {viewMode === 'board' ? (
              <>
                <SupportTicketsKanban
                  tickets={filteredTickets}
                  filtersLoading={filtersLoading}
                  onOpenTicket={(t) => setModalTicketId(t.id)}
                />
                {filteredTickets.length === 0 && (
                  <Text mt={4} textAlign="center" color={muted} fontSize="sm">
                    Nenhum chamado encontrado.
                  </Text>
                )}
              </>
            ) : (
              <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
                <Flex
                  px={6}
                  py={4}
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                  flexDir={{ base: 'column', sm: 'row' }}
                  align={{ base: 'stretch', sm: 'center' }}
                  justify="space-between"
                  gap={3}
                >
                  <Heading size="md" fontWeight="semibold">
                    Chamados recentes
                  </Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    <Button {...filterChipProps(deskFilter === 'all')} onClick={() => setDeskFilter('all')}>
                      Todos
                    </Button>
                    <Button {...filterChipProps(deskFilter === 'open')} onClick={() => setDeskFilter('open')}>
                      Abertos
                    </Button>
                    <Button
                      {...filterChipProps(deskFilter === 'resolved')}
                      onClick={() => setDeskFilter('resolved')}
                    >
                      Resolvidos
                    </Button>
                  </HStack>
                </Flex>

                {filteredTickets.length === 0 ? (
                  <VStack py={12} spacing={3}>
                    <Box w={16} h={16} borderRadius="full" bg={emptyIconBg} display="flex" alignItems="center" justifyContent="center">
                      <FolderOpen size={28} color="gray" />
                    </Box>
                    <Text fontWeight="medium">Nenhum chamado encontrado</Text>
                    <Text fontSize="sm" color={muted} textAlign="center" maxW="sm">
                      Não há chamados correspondentes ao filtro atual.
                    </Text>
                  </VStack>
                ) : isMobile ? (
                  <VStack p={4} spacing={3} align="stretch">
                    {filteredTickets.map((t) => (
                      <Card
                        key={t.id}
                        size="sm"
                        borderWidth="1px"
                        borderColor={borderColor}
                        onClick={() => setModalTicketId(t.id)}
                        cursor="pointer"
                        _hover={{ shadow: 'md' }}
                      >
                        <CardBody>
                          <Text fontFamily="mono" fontSize="xs" color={muted} mb={1}>
                            #{shortTicketId(t.id)}
                          </Text>
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={2} mb={2}>
                            {t.subject}
                          </Text>
                          <HStack flexWrap="wrap" spacing={1}>
                            <Badge colorScheme={ticketStatusColorScheme(t.status)} fontSize="0.65rem">
                              {statusLabel(t.status)}
                            </Badge>
                            <Badge colorScheme={ticketPriorityColorScheme(t.priority)} fontSize="0.65rem">
                              {priorityLabel(t.priority)}
                            </Badge>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                ) : (
                  <TableContainer opacity={filtersLoading ? 0.6 : 1}>
                    <Table size="sm">
                      <Thead bg={tableHeaderBg}>
                        <Tr>
                          <Th fontSize="xs" textTransform="uppercase" color={muted}>
                            ID
                          </Th>
                          <Th fontSize="xs" textTransform="uppercase" color={muted}>
                            Assunto
                          </Th>
                          <Th fontSize="xs" textTransform="uppercase" color={muted}>
                            Solicitante
                          </Th>
                          <Th fontSize="xs" textTransform="uppercase" color={muted}>
                            Prioridade
                          </Th>
                          <Th fontSize="xs" textTransform="uppercase" color={muted}>
                            Status
                          </Th>
                          <Th fontSize="xs" textTransform="uppercase" color={muted}>
                            Data
                          </Th>
                          <Th fontSize="xs" textTransform="uppercase" color={muted} textAlign="right">
                            Ação
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredTickets.map((t) => (
                          <Tr
                            key={t.id}
                            _hover={{ bg: tableRowHover }}
                            transition="background 0.15s"
                            role="group"
                          >
                            <Td fontFamily="mono" fontSize="xs" color={muted}>
                              {shortTicketId(t.id)}
                            </Td>
                            <Td maxW="240px">
                              <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                                {t.subject}
                              </Text>
                              <Text fontSize="xs" color={muted} noOfLines={1}>
                                {ticketTypeLabel(t.ticket_type ?? 'OTHER')}
                              </Text>
                            </Td>
                            <Td maxW="160px">
                              <Text fontSize="sm" noOfLines={1}>
                                {t.requester?.name ?? '—'}
                              </Text>
                              <Text fontSize="xs" color={muted} noOfLines={1}>
                                {[t.location?.name, t.sector?.name].filter(Boolean).join(' · ') || '—'}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={ticketPriorityColorScheme(t.priority)} fontSize="0.65rem">
                                {priorityLabel(t.priority)}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={ticketStatusColorScheme(t.status)} fontSize="0.65rem">
                                {statusLabel(t.status)}
                              </Badge>
                            </Td>
                            <Td fontSize="xs" color={muted} whiteSpace="nowrap">
                              {formatTicketDate(t.created_at).split(',')[0]}
                            </Td>
                            <Td textAlign="right">
                              <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                opacity={{ base: 1, md: 0 }}
                                _groupHover={{ opacity: 1 }}
                                _focus={{ opacity: 1 }}
                                onClick={() => setModalTicketId(t.id)}
                              >
                                Ver detalhes
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      <SupportTicketDeskModal
        ticketId={modalTicketId}
        isOpen={!!modalTicketId}
        onClose={() => setModalTicketId(null)}
        userRole={userRole}
        userId={userId}
        onTicketUpdated={handleTicketUpdated}
        onTicketDeleted={handleTicketDeleted}
      />
    </Box>
  );
}
