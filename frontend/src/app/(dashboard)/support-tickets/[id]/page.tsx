'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  VStack,
  Textarea,
  Select,
  Spinner,
  Flex,
  Text,
  Badge,
  HStack,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Image,
  Link,
} from '@chakra-ui/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { SupportTicket, canViewSupportTickets, SupportTicketKind, ticketTypeLabel, ticketTypeColorScheme, statusLabel, priorityLabel, ticketStatusColorScheme, ticketPriorityColorScheme } from '../types';

interface Location {
  id: string;
  name: string;
}

interface Sector {
  id: string;
  name: string;
  location_id: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SupportTicketDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [technicians, setTechnicians] = useState<UserOption[]>([]);

  const [assigneeId, setAssigneeId] = useState<string>('');
  const [savingAssign, setSavingAssign] = useState(false);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [ticketType, setTicketType] = useState<SupportTicketKind>('OTHER');
  const [locationId, setLocationId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  const [techStatus, setTechStatus] = useState('');
  const [savingTech, setSavingTech] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const loadTicket = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (!token || !userRaw) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userRaw) as { id?: string; role?: string };
    const role = user.role ?? '';
    const uid = user.id ?? '';
    setUserId(uid);
    setUserRole(role);
    if (!canViewSupportTickets(role)) {
      router.push('/unauthorized');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/support-tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 429) {
        router.push('/rate-limit');
        return;
      }
      if (!res.ok) {
        if (res.status === 404) {
          setError('Chamado não encontrado ou sem permissão para visualizar.');
          setTicket(null);
          return;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao carregar chamado');
      }
      const data = (await res.json()) as SupportTicket;
      setTicket(data);
      setSubject(data.subject);
      setDescription(data.description);
      setPriority(data.priority);
      setTicketType(data.ticket_type ?? 'OTHER');
      setLocationId(data.location_id ?? '');
      setSectorId(data.sector_id ?? '');
      setAssigneeId(data.assigned_to_id ?? '');
      setTechStatus(data.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadTicket();
  }, [id, loadTicket]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    const loadRefs = async () => {
      const locRes = await fetch('/api/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  useEffect(() => {
    if (!locationId) {
      setSectors([]);
      return;
    }
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    let cancelled = false;
    const loadSectors = async () => {
      try {
        const secRes = await fetch(`/api/sectors/location/${locationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!secRes.ok) {
          if (!cancelled) setSectors([]);
          return;
        }
        const d = await secRes.json();
        if (!cancelled) setSectors(Array.isArray(d) ? d : []);
      } catch {
        if (!cancelled) setSectors([]);
      }
    };
    loadSectors();
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  const isPrivileged = userRole === 'ADMIN' || userRole === 'MANAGER';
  const isRequester = ticket && userId && ticket.requester_id === userId;
  const isAssigneeTech =
    ticket && userId && ticket.assigned_to_id === userId && userRole === 'TECHNICIAN';

  const isResolved = !!ticket && ticket.status === 'RESOLVED';
  const showRequesterForm = ticket && (isRequester || isPrivileged) && !isResolved;
  const showTechForm = ticket && isAssigneeTech && !isResolved;
  const showAssign = ticket && isPrivileged && !isResolved;

  const handleSaveAssign = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token || !ticket) return;
    setSavingAssign(true);
    try {
      const body: { assigned_to_id: string | null } = {
        assigned_to_id: assigneeId || null,
      };
      const res = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao atribuir técnico');
      }
      const updated = await res.json();
      setTicket(updated);
      toast({ title: 'Atribuição atualizada', status: 'success', duration: 3000 });
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro ao salvar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSavingAssign(false);
    }
  };

  const handleSaveDetails = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token || !ticket) return;
    setSavingDetails(true);
    try {
      const body: Record<string, unknown> = {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        ticket_type: ticketType,
      };
      body.location_id = locationId || null;
      body.sector_id = sectorId || null;

      const res = await fetch(`/api/support-tickets/${ticket.id}`, {
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
      const updated = await res.json();
      setTicket(updated);
      toast({ title: 'Chamado atualizado', status: 'success', duration: 3000 });
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro ao salvar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveTech = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token || !ticket) return;
    setSavingTech(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: techStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao salvar');
      }
      const updated = await res.json();
      setTicket(updated);
      toast({ title: 'Atualizado', status: 'success', duration: 3000 });
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro ao salvar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSavingTech(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket || !window.confirm('Excluir este chamado?')) return;
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao excluir');
      }
      toast({ title: 'Chamado excluído', status: 'success', duration: 3000 });
      router.push('/support-tickets');
    } catch (e: unknown) {
      toast({
        title: 'Erro',
        description: e instanceof Error ? e.message : 'Erro ao excluir',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="240px" p={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error || !ticket) {
    return (
      <Box p={8}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} mb={4} onClick={() => router.push('/support-tickets')}>
          Voltar
        </Button>
        <Text color="red.500">{error || 'Chamado não encontrado.'}</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="800px" mx="auto">
      <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} mb={4} onClick={() => router.push('/support-tickets')}>
        Voltar à lista
      </Button>

      <Box bg={cardBg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor} mb={6}>
        <HStack flexWrap="wrap" spacing={3} mb={3}>
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
          Criado em {new Date(ticket.created_at).toLocaleString('pt-BR')}
          {ticket.resolved_at && ` · Resolvido em ${new Date(ticket.resolved_at).toLocaleString('pt-BR')}`}
        </Text>
        <Text whiteSpace="pre-wrap">{ticket.description}</Text>
        {ticket.image_url && (
          <Box mt={4}>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Anexo
            </Text>
            <Link href={ticket.image_url} isExternal>
              <Image
                src={ticket.image_url}
                alt="Foto do chamado"
                maxH="320px"
                maxW="100%"
                borderRadius="md"
                borderWidth={1}
                borderColor={borderColor}
                objectFit="contain"
              />
            </Link>
          </Box>
        )}
        <Divider my={4} />
        <Text fontSize="sm">
          <strong>Solicitante:</strong> {ticket.requester?.name ?? ticket.requester_id}
        </Text>
        <Text fontSize="sm">
          <strong>Técnico:</strong> {ticket.assigned_to?.name ?? '—'}
        </Text>
        {(ticket.location?.name || ticket.sector?.name) && (
          <Text fontSize="sm" mt={1}>
            <strong>Local / setor:</strong> {ticket.location?.name ?? ''}{ticket.location && ticket.sector ? ' · ' : ''}
            {ticket.sector?.name ?? ''}
          </Text>
        )}
      </Box>

      {isResolved && (
        <Alert status="info" borderRadius="md" mb={6}>
          <AlertIcon />
          <AlertDescription>Chamado concluído — não pode ser alterado.</AlertDescription>
        </Alert>
      )}

      {showAssign && (
        <Box bg={cardBg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor} mb={6}>
          <Heading size="sm" mb={4}>
            Atribuir técnico
          </Heading>
          <VStack align="stretch" spacing={3}>
            <FormControl>
              <FormLabel>Técnico</FormLabel>
              <Select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Sem técnico</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button colorScheme="blue" onClick={handleSaveAssign} isLoading={savingAssign}>
              Salvar atribuição
            </Button>
          </VStack>
        </Box>
      )}

      {showRequesterForm && (
        <Box bg={cardBg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor} mb={6}>
          <Heading size="sm" mb={4}>
            {isPrivileged ? 'Editar dados do chamado' : 'Atualizar meu chamado'}
          </Heading>
          <VStack align="stretch" spacing={3}>
            <FormControl>
              <FormLabel>Assunto</FormLabel>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </FormControl>
            <FormControl>
              <FormLabel>Prioridade</FormLabel>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Tipo de chamado</FormLabel>
              <Select value={ticketType} onChange={(e) => setTicketType(e.target.value as SupportTicketKind)}>
                <option value="INCIDENT">Incidente</option>
                <option value="SERVICE_REQUEST">Requisição de serviço</option>
                <option value="QUESTION">Dúvida / informação</option>
                <option value="OTHER">Outro</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Polo / local</FormLabel>
              <Select
              placeholder="Selecione"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setSectorId('');
              }}
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
              <FormLabel>Setor</FormLabel>
              <Select
                placeholder={locationId ? 'Selecione' : 'Escolha um local'}
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
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
            <Button colorScheme="teal" onClick={handleSaveDetails} isLoading={savingDetails}>
              Salvar alterações
            </Button>
          </VStack>
        </Box>
      )}

      {showTechForm && (
        <Box bg={cardBg} p={6} borderRadius="md" borderWidth={1} borderColor={borderColor} mb={6}>
          <Heading size="sm" mb={4}>
            Atualização do técnico
          </Heading>
          <VStack align="stretch" spacing={3}>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select value={techStatus} onChange={(e) => setTechStatus(e.target.value)}>
                <option value="OPEN">Aberto</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="RESOLVED">Resolvido</option>
              </Select>
            </FormControl>
            <Button colorScheme="blue" onClick={handleSaveTech} isLoading={savingTech}>
              Salvar status
            </Button>
          </VStack>
        </Box>
      )}

      {isPrivileged && (
        <Button
          leftIcon={<Trash2 size={18} />}
          colorScheme="red"
          variant="outline"
          onClick={handleDelete}
          isLoading={deleting}
        >
          Excluir chamado
        </Button>
      )}
    </Box>
  );
}
