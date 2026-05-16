'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  Textarea,
  Select,
  Text,
  Badge,
  HStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Image,
  Link,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { Trash2, Play, CheckCheck, RotateCcw } from 'lucide-react';
import {
  SupportTicket,
  SupportTicketKind,
  TicketStatus,
  formatTicketDate,
  priorityLabel,
  statusLabel,
  ticketPriorityColorScheme,
  ticketStatusColorScheme,
  ticketTypeColorScheme,
  ticketTypeLabel,
  shortTicketId,
} from './types';

export interface LocationOption {
  id: string;
  name: string;
}

export interface SectorOption {
  id: string;
  name: string;
  location_id: string;
}

export interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useSupportTicketResources() {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [technicians, setTechnicians] = useState<UserOption[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    const loadRefs = async () => {
      const locRes = await fetch('/api/locations', { headers: { Authorization: `Bearer ${token}` } });
      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(Array.isArray(d) ? d : []);
      }
      const uRes = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (uRes.ok) {
        const uData = await uRes.json();
        const all = Array.isArray(uData) ? uData : [];
        setTechnicians(all.filter((u: UserOption) => u.role === 'TECHNICIAN'));
      }
    };
    loadRefs();
  }, []);

  const loadSectorsForLocation = async (locationId: string) => {
    if (!locationId) {
      setSectors([]);
      return;
    }
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    try {
      const secRes = await fetch(`/api/sectors/location/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!secRes.ok) {
        setSectors([]);
        return;
      }
      const d = await secRes.json();
      setSectors(Array.isArray(d) ? d : []);
    } catch {
      setSectors([]);
    }
  };

  return { locations, sectors, technicians, loadSectorsForLocation, setSectors };
}

export function SupportTicketReadOnlySummary({ ticket }: { ticket: SupportTicket }) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const metaBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const idBadgeBg = useColorModeValue('gray.200', 'gray.600');
  const idBadgeColor = useColorModeValue('gray.700', 'gray.100');

  return (
    <Box>
      <HStack flexWrap="wrap" spacing={2} mb={3}>
        <Badge fontFamily="mono" fontSize="xs" bg={idBadgeBg} color={idBadgeColor}>
          #{shortTicketId(ticket.id)}
        </Badge>
        <Badge colorScheme={ticketStatusColorScheme(ticket.status)}>{statusLabel(ticket.status)}</Badge>
        <Badge colorScheme={ticketPriorityColorScheme(ticket.priority)}>{priorityLabel(ticket.priority)}</Badge>
        <Badge colorScheme={ticketTypeColorScheme(ticket.ticket_type ?? 'OTHER')}>
          {ticketTypeLabel(ticket.ticket_type ?? 'OTHER')}
        </Badge>
      </HStack>
      <Heading size="md" mb={2}>
        {ticket.subject}
      </Heading>
      <Text color="gray.600" fontSize="sm" mb={4}>
        Aberto em {formatTicketDate(ticket.created_at)}
        {ticket.resolved_at && ` · Resolvido em ${formatTicketDate(ticket.resolved_at)}`}
      </Text>

      <SimpleGridMeta ticket={ticket} metaBg={metaBg} borderColor={borderColor} />

      <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={2} mt={4}>
        Descrição
      </Text>
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        fontSize="sm"
        whiteSpace="pre-wrap"
        minH="80px"
      >
        {ticket.description}
      </Box>

      {ticket.image_url && (
        <Box mt={4}>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Anexo
          </Text>
          <Link href={ticket.image_url} isExternal>
            <Image
              src={ticket.image_url}
              alt="Foto do chamado"
              maxH="240px"
              maxW="100%"
              borderRadius="md"
              borderWidth={1}
              borderColor={borderColor}
              objectFit="contain"
            />
          </Link>
        </Box>
      )}
    </Box>
  );
}

function SimpleGridMeta({
  ticket,
  metaBg,
  borderColor,
}: {
  ticket: SupportTicket;
  metaBg: string;
  borderColor: string;
}) {
  return (
    <Box bg={metaBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={4}>
      <Flex flexWrap="wrap" gap={4}>
        <Box flex="1" minW="140px">
          <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>
            Solicitante
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {ticket.requester?.name ?? '—'}
          </Text>
        </Box>
        <Box flex="1" minW="140px">
          <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>
            Técnico
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {ticket.assigned_to?.name ?? '—'}
          </Text>
        </Box>
        <Box flex="1" minW="140px">
          <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" mb={1}>
            Local / setor
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {[ticket.location?.name, ticket.sector?.name].filter(Boolean).join(' · ') || '—'}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

export function SupportTicketResolvedAlert() {
  return (
    <Alert status="info" borderRadius="md" mt={4}>
      <AlertIcon />
      <AlertDescription>Chamado concluído — não pode ser alterado.</AlertDescription>
    </Alert>
  );
}

export interface SupportTicketAssignPanelProps {
  assigneeId: string;
  onAssigneeChange: (id: string) => void;
  technicians: UserOption[];
  onSave: () => void;
  isLoading: boolean;
  compact?: boolean;
}

export function SupportTicketAssignPanel({
  assigneeId,
  onAssigneeChange,
  technicians,
  onSave,
  isLoading,
  compact,
}: SupportTicketAssignPanelProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={cardBg}
      p={compact ? 4 : 6}
      borderRadius="md"
      borderWidth={1}
      borderColor={borderColor}
      mt={4}
    >
      <Heading size="sm" mb={3}>
        Atribuir técnico
      </Heading>
      <VStack align="stretch" spacing={3}>
        <FormControl>
          <FormLabel fontSize="sm">Técnico</FormLabel>
          <Select size="sm" value={assigneeId} onChange={(e) => onAssigneeChange(e.target.value)}>
            <option value="">Sem técnico</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </Select>
        </FormControl>
        <Button size="sm" colorScheme="blue" onClick={onSave} isLoading={isLoading}>
          Salvar atribuição
        </Button>
      </VStack>
    </Box>
  );
}

export interface SupportTicketEditPanelProps {
  subject: string;
  description: string;
  priority: string;
  ticketType: SupportTicketKind;
  locationId: string;
  sectorId: string;
  locations: LocationOption[];
  sectors: SectorOption[];
  onSubjectChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onTicketTypeChange: (v: SupportTicketKind) => void;
  onLocationChange: (id: string) => void;
  onSectorChange: (id: string) => void;
  onSave: () => void;
  isLoading: boolean;
  isPrivileged?: boolean;
  compact?: boolean;
}

export function SupportTicketEditPanel({
  subject,
  description,
  priority,
  ticketType,
  locationId,
  sectorId,
  locations,
  sectors,
  onSubjectChange,
  onDescriptionChange,
  onPriorityChange,
  onTicketTypeChange,
  onLocationChange,
  onSectorChange,
  onSave,
  isLoading,
  isPrivileged = true,
  compact,
}: SupportTicketEditPanelProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={cardBg} p={compact ? 4 : 6} borderRadius="md" borderWidth={1} borderColor={borderColor} mt={4}>
      <Heading size="sm" mb={3}>
        {isPrivileged ? 'Editar dados do chamado' : 'Atualizar meu chamado'}
      </Heading>
      <VStack align="stretch" spacing={3}>
        <FormControl>
          <FormLabel fontSize="sm">Assunto</FormLabel>
          <Input size="sm" value={subject} onChange={(e) => onSubjectChange(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Descrição</FormLabel>
          <Textarea size="sm" value={description} onChange={(e) => onDescriptionChange(e.target.value)} rows={4} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Prioridade</FormLabel>
          <Select size="sm" value={priority} onChange={(e) => onPriorityChange(e.target.value)}>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Tipo de chamado</FormLabel>
          <Select size="sm" value={ticketType} onChange={(e) => onTicketTypeChange(e.target.value as SupportTicketKind)}>
            <option value="INCIDENT">Incidente</option>
            <option value="SERVICE_REQUEST">Requisição de serviço</option>
            <option value="QUESTION">Dúvida / informação</option>
            <option value="OTHER">Outro</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Polo / local</FormLabel>
          <Select
            size="sm"
            placeholder="Selecione"
            value={locationId}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            <option value="">—</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm">Setor</FormLabel>
          <Select
            size="sm"
            placeholder={locationId ? 'Selecione' : 'Escolha um local'}
            value={sectorId}
            onChange={(e) => onSectorChange(e.target.value)}
            isDisabled={!locationId}
          >
            <option value="">—</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button size="sm" colorScheme="teal" onClick={onSave} isLoading={isLoading}>
          Salvar alterações
        </Button>
      </VStack>
    </Box>
  );
}

export interface SupportTicketAdminStatusActionsProps {
  currentStatus: TicketStatus;
  onStatusChange: (status: TicketStatus) => void;
  isLoading: boolean;
}

export function SupportTicketAdminStatusActions({
  currentStatus,
  onStatusChange,
  isLoading,
}: SupportTicketAdminStatusActionsProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box borderTopWidth="1px" borderColor={borderColor} pt={4} mt={4}>
      <Text fontSize="sm" fontWeight="medium" mb={3}>
        Atualizar status
      </Text>
      <Flex flexWrap="wrap" gap={2}>
        {currentStatus === 'OPEN' && (
          <Button
            size="sm"
            colorScheme="purple"
            leftIcon={<Play size={16} />}
            onClick={() => onStatusChange('IN_PROGRESS')}
            isLoading={isLoading}
          >
            Iniciar atendimento
          </Button>
        )}
        {currentStatus === 'IN_PROGRESS' && (
          <>
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<CheckCheck size={16} />}
              onClick={() => onStatusChange('RESOLVED')}
              isLoading={isLoading}
            >
              Marcar como resolvido
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorScheme="orange"
              leftIcon={<RotateCcw size={16} />}
              onClick={() => onStatusChange('OPEN')}
              isLoading={isLoading}
            >
              Voltar para aberto
            </Button>
          </>
        )}
      </Flex>
    </Box>
  );
}

export interface SupportTicketTechStatusPanelProps {
  techStatus: string;
  onStatusChange: (status: string) => void;
  onSave: () => void;
  isLoading: boolean;
  compact?: boolean;
}

export function SupportTicketTechStatusPanel({
  techStatus,
  onStatusChange,
  onSave,
  isLoading,
  compact,
}: SupportTicketTechStatusPanelProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={cardBg} p={compact ? 4 : 6} borderRadius="md" borderWidth={1} borderColor={borderColor} mt={4}>
      <Heading size="sm" mb={3}>
        Atualização do técnico
      </Heading>
      <VStack align="stretch" spacing={3}>
        <FormControl>
          <FormLabel fontSize="sm">Status</FormLabel>
          <Select size="sm" value={techStatus} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="OPEN">Aberto</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="RESOLVED">Resolvido</option>
          </Select>
        </FormControl>
        <Button size="sm" colorScheme="blue" onClick={onSave} isLoading={isLoading}>
          Salvar status
        </Button>
      </VStack>
    </Box>
  );
}

export function SupportTicketDeleteButton({
  onDelete,
  isLoading,
}: {
  onDelete: () => void;
  isLoading: boolean;
}) {
  return (
    <Button
      mt={4}
      size="sm"
      leftIcon={<Trash2 size={16} />}
      colorScheme="red"
      variant="outline"
      onClick={onDelete}
      isLoading={isLoading}
    >
      Excluir chamado
    </Button>
  );
}

export function useSupportTicketMutations(ticketId: string | undefined) {
  const toast = useToast();

  const putTicket = async (body: Record<string, unknown>) => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token || !ticketId) throw new Error('Sessão inválida');
    const res = await fetch(`/api/support-tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao salvar');
    }
    return (await res.json()) as SupportTicket;
  };

  const deleteTicket = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token || !ticketId) throw new Error('Sessão inválida');
    const res = await fetch(`/api/support-tickets/${ticketId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao excluir');
    }
  };

  const showError = (e: unknown) => {
    toast({
      title: 'Erro',
      description: e instanceof Error ? e.message : 'Erro ao salvar',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  const showSuccess = (title: string) => {
    toast({ title, status: 'success', duration: 3000 });
  };

  return { putTicket, deleteTicket, showError, showSuccess };
}
