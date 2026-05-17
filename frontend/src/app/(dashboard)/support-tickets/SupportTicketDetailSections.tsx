'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Play, CheckCheck, RotateCcw, Loader2 } from 'lucide-react';
import {
  SupportTicket,
  SupportTicketKind,
  TicketStatus,
  formatTicketDate,
  shortTicketId,
} from './types';
import { StatusBadge } from '@/components/support-desk/StatusBadge';
import { PriorityBadge } from '@/components/support-desk/PriorityBadge';
import { TypeBadge } from '@/components/support-desk/TypeBadge';
import { cardClass, inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/support-desk/formClasses';
import { cn } from '@/components/support-desk/cn';

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
  const sectorsForLocationRef = useRef<string | null>(null);

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

  const loadSectorsForLocation = useCallback(async (locationId: string) => {
    if (!locationId) {
      sectorsForLocationRef.current = null;
      setSectors([]);
      return;
    }
    if (sectorsForLocationRef.current === locationId) return;
    sectorsForLocationRef.current = locationId;

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
      sectorsForLocationRef.current = null;
      setSectors([]);
    }
  }, []);

  return { locations, sectors, technicians, loadSectorsForLocation, setSectors };
}

export function SupportTicketReadOnlySummary({ ticket }: { ticket: SupportTicket }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:bg-slate-600 dark:text-slate-200">
          #{shortTicketId(ticket.id)}
        </span>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
        <TypeBadge kind={ticket.ticket_type ?? 'OTHER'} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{ticket.subject}</h3>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Aberto em {formatTicketDate(ticket.created_at)}
        {ticket.resolved_at && ` · Resolvido em ${formatTicketDate(ticket.resolved_at)}`}
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/40">
                <div className="flex flex-wrap gap-4">
            <MetaItem label="Solicitante" value={ticket.requester?.name ?? '—'} />
            <MetaItem label="Técnico" value={ticket.assigned_to?.name ?? '—'} />
            <MetaItem
              label="Local / setor"
              value={[ticket.location?.name, ticket.sector?.name].filter(Boolean).join(' · ') || '—'}
            />
          </div>
      </div>
      <p className="mb-2 mt-4 text-xs font-semibold uppercase text-slate-500">Descrição</p>
      <div className="min-h-[80px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
        {ticket.description}
      </div>
      {ticket.image_url && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Anexo</p>
          <a href={ticket.image_url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.image_url}
              alt="Foto do chamado"
              className="max-h-60 max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-600"
            />
          </a>
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[140px] flex-1">
      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

export function SupportTicketResolvedAlert() {
  return (
    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
      Chamado concluído — não pode ser alterado.
    </div>
  );
}

export interface SupportTicketAssignPanelProps {
  assigneeId: string;
  onAssigneeChange: (id: string) => void;
  technicians: UserOption[];
  onSave: () => void;
  isLoading: boolean;
}

export function SupportTicketAssignPanel({
  assigneeId,
  onAssigneeChange,
  technicians,
  onSave,
  isLoading,
}: SupportTicketAssignPanelProps) {
  return (
    <div className={cn(cardClass, 'mt-4 space-y-3')}>
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Atribuir técnico</h4>
      <div>
        <label className={labelClass}>Técnico</label>
        <select className={inputClass} value={assigneeId} onChange={(e) => onAssigneeChange(e.target.value)}>
          <option value="">Sem técnico</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.email})
            </option>
          ))}
        </select>
      </div>
      <button type="button" className={btnPrimary} onClick={onSave} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar atribuição
      </button>
    </div>
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
}

export function SupportTicketEditPanel(props: SupportTicketEditPanelProps) {
  const {
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
  } = props;

  return (
    <div className={cn(cardClass, 'mt-4 space-y-3')}>
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {isPrivileged ? 'Editar dados do chamado' : 'Atualizar meu chamado'}
      </h4>
      <div>
        <label className={labelClass}>Assunto</label>
        <input className={inputClass} value={subject} onChange={(e) => onSubjectChange(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          className={cn(inputClass, 'resize-y')}
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Prioridade</label>
        <select className={inputClass} value={priority} onChange={(e) => onPriorityChange(e.target.value)}>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
      </div>
        <div>
          <label className={labelClass}>Tipo de chamado</label>
          <select
            className={inputClass}
            value={ticketType}
            onChange={(e) => onTicketTypeChange(e.target.value as SupportTicketKind)}
          >
            <option value="INCIDENT">Incidente</option>
            <option value="SERVICE_REQUEST">Requisição de serviço</option>
            <option value="QUESTION">Dúvida / informação</option>
            <option value="OTHER">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Polo / local</label>
          <select className={inputClass} value={locationId} onChange={(e) => onLocationChange(e.target.value)}>
            <option value="">—</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Setor</label>
          <select
            className={inputClass}
            value={sectorId}
            onChange={(e) => onSectorChange(e.target.value)}
            disabled={!locationId}
          >
            <option value="">{locationId ? 'Selecione' : 'Escolha um local'}</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      <button type="button" className={cn(btnPrimary, 'bg-teal-600 hover:bg-teal-700')} onClick={onSave} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar alterações
      </button>
    </div>
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
  return (
    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-100">Atualizar status</p>
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'OPEN' && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onStatusChange('IN_PROGRESS')}
            className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
          >
            <Play className="mr-1.5 h-4 w-4" />
            Iniciar atendimento
          </button>
        )}
        {currentStatus === 'IN_PROGRESS' && (
          <>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onStatusChange('RESOLVED')}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Marcar como resolvido
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onStatusChange('OPEN')}
              className="inline-flex items-center rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50 dark:border-orange-700 dark:bg-slate-800 dark:text-orange-300"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Voltar para aberto
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export interface SupportTicketTechStatusPanelProps {
  techStatus: string;
  onStatusChange: (status: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function SupportTicketTechStatusPanel({
  techStatus,
  onStatusChange,
  onSave,
  isLoading,
}: SupportTicketTechStatusPanelProps) {
  return (
        <div className={cn(cardClass, 'mt-4 space-y-3')}>
          <h4 className="text-sm font-semibold">Atualização do técnico</h4>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={techStatus} onChange={(e) => onStatusChange(e.target.value)}>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="RESOLVED">Resolvido</option>
            </select>
          </div>
          <button type="button" className={btnPrimary} onClick={onSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar status
          </button>
        </div>
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
    <button
      type="button"
      onClick={onDelete}
      disabled={isLoading}
      className={cn(btnSecondary, 'mt-4 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400')}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Excluir chamado
    </button>
  );
}

export function useSupportTicketMutations(ticketId: string | undefined) {
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
    toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
  };

  const showSuccess = (title: string) => {
    toast.success(title);
  };

  return { putTicket, deleteTicket, showError, showSuccess };
}
