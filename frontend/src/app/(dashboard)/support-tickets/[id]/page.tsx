'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  SupportTicket,
  ROLES_TICKETS_VIEW,
  SupportTicketKind,
  TicketStatus,
} from '@/features/support-tickets/types';
import { getHighestPriorityRole } from '@ti-assistant/contracts/dist/roles';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';
import {
  fetchSupportTicketById,
  RateLimitError,
} from '@/features/support-tickets/api/supportTicketApi';
import {
  SupportTicketReadOnlySummary,
  SupportTicketResolvedAlert,
  SupportTicketAssignPanel,
  SupportTicketEditPanel,
  SupportTicketAdminStatusActions,
  SupportTicketTechStatusPanel,
  SupportTicketDeleteButton,
  useSupportTicketResources,
  useSupportTicketMutations,
} from '../SupportTicketDetailSections';
import { cardClass } from '@/components/support-desk/formClasses';
import { cn } from '@/components/support-desk/cn';

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar à lista
    </button>
  );
}

export default function SupportTicketDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [assigneeId, setAssigneeId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [ticketType, setTicketType] = useState<SupportTicketKind>('OTHER');
  const [locationId, setLocationId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [techStatus, setTechStatus] = useState('');

  const [savingAssign, setSavingAssign] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingTech, setSavingTech] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { locations, sectors, technicians, loadSectorsForLocation } = useSupportTicketResources();
  const { putTicket, deleteTicket, showError, showSuccess } = useSupportTicketMutations(id);

  const syncForm = useCallback((data: SupportTicket) => {
    setSubject(data.subject);
    setDescription(data.description);
    setPriority(data.priority);
    setTicketType(data.ticket_type ?? 'OTHER');
    setLocationId(data.location_id ?? '');
    setSectorId(data.sector_id ?? '');
    setAssigneeId(data.assigned_to_id ?? '');
    setTechStatus(data.status);
  }, []);

  const loadTicket = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (!token || !userRaw) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userRaw) as { id?: string; roles?: string[]; role?: string };
    const roles = resolveUserRoles(user);
    const uid = user.id ?? '';
    setUserId(uid);
    const access = assertPageAccess(roles, ROLES_TICKETS_VIEW);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setUserRole(getHighestPriorityRole(roles));

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportTicketById(token, id);
      setTicket(data);
      syncForm(data);
    } catch (e: unknown) {
      if (e instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      const message = e instanceof Error ? e.message : 'Erro ao carregar';
      if (message.toLowerCase().includes('não encontrado')) {
        setError('Chamado não encontrado ou sem permissão para visualizar.');
        setTicket(null);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, router, syncForm]);

  useEffect(() => {
    if (id) loadTicket();
  }, [id, loadTicket]);

  useEffect(() => {
    if (locationId) loadSectorsForLocation(locationId);
  }, [locationId, loadSectorsForLocation]);

  const isPrivileged = userRole === 'ADMIN' || userRole === 'MANAGER';
  const isRequester = ticket && userId && ticket.requester_id === userId;
  const isAssigneeTech =
    ticket && userId && ticket.assigned_to_id === userId && userRole === 'TECHNICIAN';

  const isResolved = !!ticket && ticket.status === 'RESOLVED';
  const showRequesterForm = ticket && (isRequester || isPrivileged) && !isResolved;
  const showTechForm = ticket && isAssigneeTech && !isResolved;
  const showAssign = ticket && isPrivileged && !isResolved;
  const showAdminStatus = ticket && isPrivileged && !isResolved;

  const applyUpdate = (updated: SupportTicket) => {
    setTicket(updated);
    syncForm(updated);
  };

  const handleSaveAssign = async () => {
    if (!ticket) return;
    setSavingAssign(true);
    try {
      const updated = await putTicket({ assigned_to_id: assigneeId || null });
      applyUpdate(updated);
      showSuccess('Atribuição atualizada');
    } catch (e) {
      showError(e);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!ticket) return;
    setSavingDetails(true);
    try {
      const updated = await putTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        ticket_type: ticketType,
        location_id: locationId || null,
        sector_id: sectorId || null,
      });
      applyUpdate(updated);
      showSuccess('Chamado atualizado');
    } catch (e) {
      showError(e);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveTech = async () => {
    if (!ticket) return;
    setSavingTech(true);
    try {
      const updated = await putTicket({ status: techStatus });
      applyUpdate(updated);
      showSuccess('Atualizado');
    } catch (e) {
      showError(e);
    } finally {
      setSavingTech(false);
    }
  };

  const handleAdminStatus = async (status: TicketStatus) => {
    if (!ticket) return;
    setSavingStatus(true);
    try {
      const updated = await putTicket({ status });
      applyUpdate(updated);
      showSuccess('Status atualizado');
    } catch (e) {
      showError(e);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket || !window.confirm('Excluir este chamado?')) return;
    setDeleting(true);
    try {
      await deleteTicket();
      showSuccess('Chamado excluído');
      router.push('/support-tickets');
    } catch (e) {
      showError(e);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-slate-900 md:px-8">
        <div className="mx-auto max-w-3xl">
          <BackLink onClick={() => router.push('/support-tickets')} />
          <p className="text-sm text-red-600">{error || 'Chamado não encontrado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <BackLink onClick={() => router.push('/support-tickets')} />

        <div className={cn(cardClass, 'mb-6')}>
          <SupportTicketReadOnlySummary ticket={ticket} />
        </div>

        {isResolved && <SupportTicketResolvedAlert />}

        {showAdminStatus && (
          <SupportTicketAdminStatusActions
            currentStatus={ticket.status}
            onStatusChange={handleAdminStatus}
            isLoading={savingStatus}
          />
        )}

        {showAssign && (
          <SupportTicketAssignPanel
            assigneeId={assigneeId}
            onAssigneeChange={setAssigneeId}
            technicians={technicians}
            onSave={handleSaveAssign}
            isLoading={savingAssign}
          />
        )}

        {showRequesterForm && (
          <SupportTicketEditPanel
            subject={subject}
            description={description}
            priority={priority}
            ticketType={ticketType}
            locationId={locationId}
            sectorId={sectorId}
            locations={locations}
            sectors={sectors}
            onSubjectChange={setSubject}
            onDescriptionChange={setDescription}
            onPriorityChange={setPriority}
            onTicketTypeChange={setTicketType}
            onLocationChange={(locId) => {
              setLocationId(locId);
              setSectorId('');
              loadSectorsForLocation(locId);
            }}
            onSectorChange={setSectorId}
            onSave={handleSaveDetails}
            isLoading={savingDetails}
            isPrivileged={isPrivileged}
          />
        )}

        {showTechForm && (
          <SupportTicketTechStatusPanel
            techStatus={techStatus}
            onStatusChange={setTechStatus}
            onSave={handleSaveTech}
            isLoading={savingTech}
          />
        )}

        {isPrivileged && <SupportTicketDeleteButton onDelete={handleDelete} isLoading={deleting} />}
      </div>
    </div>
  );
}
