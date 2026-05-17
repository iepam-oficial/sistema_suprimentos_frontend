'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SupportTicket, SupportTicketKind, TicketStatus, canViewSupportTickets } from './types';
import { DeskModal } from '@/components/support-desk/DeskModal';
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
} from './SupportTicketDetailSections';

export interface SupportTicketDeskModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: string | null;
  userId: string | null;
  onTicketUpdated: (ticket: SupportTicket) => void;
  onTicketDeleted?: (ticketId: string) => void;
}

export function SupportTicketDeskModal({
  ticketId,
  isOpen,
  onClose,
  userRole,
  userId,
  onTicketUpdated,
  onTicketDeleted,
}: SupportTicketDeskModalProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const { putTicket, deleteTicket, showError, showSuccess } = useSupportTicketMutations(ticketId ?? undefined);

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
    if (!ticketId) return;
    const token = localStorage.getItem('@ti-assistant:token');
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (!token || !userRaw) return;
    const user = JSON.parse(userRaw) as { role?: string };
    if (!canViewSupportTickets(user.role ?? '')) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao carregar chamado');
      }
      const data = (await res.json()) as SupportTicket;
      setTicket(data);
      syncForm(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId, syncForm]);

  useEffect(() => {
    if (isOpen && ticketId) loadTicket();
    if (!isOpen) {
      setTicket(null);
      setError(null);
    }
  }, [isOpen, ticketId, loadTicket]);

  useEffect(() => {
    if (locationId) loadSectorsForLocation(locationId);
  }, [locationId, loadSectorsForLocation]);

  const isPrivileged = userRole === 'ADMIN' || userRole === 'MANAGER';
  const isRequester = ticket && userId && ticket.requester_id === userId;
  const isAssigneeTech =
    ticket && userId && ticket.assigned_to_id === userId && userRole === 'TECHNICIAN';
  const isResolved = !!ticket && ticket.status === 'RESOLVED';

  const applyUpdate = (updated: SupportTicket) => {
    setTicket(updated);
    syncForm(updated);
    onTicketUpdated(updated);
  };

  const handleSaveAssign = async () => {
    if (!ticket) return;
    setSavingAssign(true);
    try {
      applyUpdate(await putTicket({ assigned_to_id: assigneeId || null }));
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
      applyUpdate(
        await putTicket({
          subject: subject.trim(),
          description: description.trim(),
          priority,
          ticket_type: ticketType,
          location_id: locationId || null,
          sector_id: sectorId || null,
        }),
      );
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
      applyUpdate(await putTicket({ status: techStatus }));
      showSuccess('Status atualizado');
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
      applyUpdate(await putTicket({ status }));
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
      onTicketDeleted?.(ticket.id);
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeskModal isOpen={isOpen} onClose={onClose} title={ticket?.subject ?? 'Detalhes do chamado'}>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : ticket ? (
        <>
          <SupportTicketReadOnlySummary ticket={ticket} />
          {isResolved && <SupportTicketResolvedAlert />}
          {isPrivileged && !isResolved && (
            <SupportTicketAdminStatusActions
              currentStatus={ticket.status}
              onStatusChange={handleAdminStatus}
              isLoading={savingStatus}
            />
          )}
          {isPrivileged && !isResolved && (
            <SupportTicketAssignPanel
              assigneeId={assigneeId}
              onAssigneeChange={setAssigneeId}
              technicians={technicians}
              onSave={handleSaveAssign}
              isLoading={savingAssign}
            />
          )}
          {(isRequester || isPrivileged) && !isResolved && (
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
              onLocationChange={(id) => {
                setLocationId(id);
                setSectorId('');
                loadSectorsForLocation(id);
              }}
              onSectorChange={setSectorId}
              onSave={handleSaveDetails}
              isLoading={savingDetails}
              isPrivileged={isPrivileged}
            />
          )}
          {isAssigneeTech && !isResolved && (
            <SupportTicketTechStatusPanel
              techStatus={techStatus}
              onStatusChange={setTechStatus}
              onSave={handleSaveTech}
              isLoading={savingTech}
            />
          )}
          {isPrivileged && !isResolved && (
            <SupportTicketDeleteButton onDelete={handleDelete} isLoading={deleting} />
          )}
        </>
      ) : null}
    </DeskModal>
  );
}
