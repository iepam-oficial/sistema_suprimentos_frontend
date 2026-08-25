'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { useSupportTicketsFetch } from '@/features/support-tickets/hooks/useSupportTicketsFetch';
import {
  canCreateSupportTicket,
  formatTicketDate,
  ticketTypeLabel,
  SupportTicket,
} from './types';
import { StatusBadge } from '@/components/support-desk/StatusBadge';
import { PriorityBadge } from '@/components/support-desk/PriorityBadge';
import { TypeBadge } from '@/components/support-desk/TypeBadge';
import { StatCard } from '@/components/support-desk/StatCard';
import { SupportDeskPageShell } from '@/components/support-desk/SupportDeskPageShell';
import { DeskEmptyState } from '@/components/support-desk/DeskEmptyState';
import { computeTicketStats } from '@/components/support-desk/ticketStats';
import { cn } from '@/components/support-desk/cn';
import { inputClass, btnPrimary } from '@/components/support-desk/formClasses';

const STATUS_ACCENT: Record<string, string> = {
  OPEN: 'border-l-blue-400',
  IN_PROGRESS: 'border-l-orange-400',
  RESOLVED: 'border-l-emerald-500',
};

export function SupportTicketsLegacyListView() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const router = useRouter();

  const { tickets, initialLoading, filtersLoading, error, userRoles } = useSupportTicketsFetch({
    priorityFilter,
    fetchAllStatuses: true,
  });

  const canCreate = canCreateSupportTicket(userRoles);

  const stats = useMemo(() => computeTicketStats(tickets), [tickets]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (statusFilter) {
      list = list.filter((t) => t.status === statusFilter);
    }
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [tickets, statusFilter]);

  const renderTicketActions = (t: SupportTicket) => {
    if (t.status === 'RESOLVED') {
      return <span className="text-sm text-slate-500">—</span>;
    }
    return (
      <button
        type="button"
        onClick={() => router.push(`/support-tickets/${t.id}`)}
        className="rounded-md border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:border-primary-800 dark:hover:bg-primary-900/30"
      >
        Detalhes
      </button>
    );
  };

  const headerRight = (
    <>
      {canCreate && (
        <button
          type="button"
          onClick={() => router.push('/support-tickets/new')}
          className={cn(btnPrimary, 'inline-flex shrink-0 items-center gap-1.5 py-2')}
        >
          <Plus size={16} />
          Novo chamado
        </button>
      )}
      <select
        className={cn(inputClass, 'w-[130px] shrink-0 py-2 sm:w-[140px]')}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        disabled={initialLoading}
      >
        <option value="">Status</option>
        <option value="OPEN">Aberto</option>
        <option value="IN_PROGRESS">Em andamento</option>
        <option value="RESOLVED">Resolvido</option>
      </select>
      <select
        className={cn(inputClass, 'w-[130px] shrink-0 py-2 sm:w-[140px]')}
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        disabled={initialLoading}
      >
        <option value="">Prioridade</option>
        <option value="LOW">Baixa</option>
        <option value="MEDIUM">Média</option>
        <option value="HIGH">Alta</option>
        <option value="URGENT">Urgente</option>
      </select>
      {filtersLoading && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600" />}
    </>
  );

  return (
    <SupportDeskPageShell title="Chamados" headerRight={headerRight}>
      {initialLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total de chamados" value={stats.total} variant="total" />
            <StatCard label="Abertos" value={stats.open} variant="open" />
            <StatCard label="Em andamento" value={stats.progress} variant="progress" />
            <StatCard label="Resolvidos" value={stats.resolved} variant="resolved" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Meus chamados</h2>
            </div>

            {filteredTickets.length === 0 ? (
              <DeskEmptyState />
            ) : (
              <>
                <div className={cn('space-y-3 p-4 md:hidden', filtersLoading && 'opacity-60')}>
                  {filteredTickets.map((t) => {
                    const interactive = t.status !== 'RESOLVED';
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          'rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800',
                          STATUS_ACCENT[t.status] ?? 'border-l-slate-300',
                          interactive && 'cursor-pointer hover:shadow-md',
                        )}
                        onClick={interactive ? () => router.push(`/support-tickets/${t.id}`) : undefined}
                        onKeyDown={
                          interactive
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  router.push(`/support-tickets/${t.id}`);
                                }
                              }
                            : undefined
                        }
                        role={interactive ? 'button' : undefined}
                        tabIndex={interactive ? 0 : undefined}
                      >
                        <p className="mb-2 line-clamp-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {t.subject}
                        </p>
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                          <TypeBadge kind={t.ticket_type ?? 'OTHER'} />
                        </div>
                        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <p className="truncate">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Solicitante</span>{' '}
                            {t.requester?.name ?? '—'}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Técnico</span>{' '}
                            {t.assigned_to?.name ?? '—'}
                          </p>
                          <p>{formatTicketDate(t.created_at)}</p>
                        </div>
                        <hr className="my-2.5 border-slate-200 dark:border-slate-600" />
                        <div onClick={(e) => e.stopPropagation()}>{renderTicketActions(t)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className={cn('hidden overflow-x-auto md:block', filtersLoading && 'opacity-60')}>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        {[
                          'Assunto',
                          'Status',
                          'Prioridade',
                          'Tipo',
                          'Solicitante',
                          'Técnico',
                          'Criado em',
                          'Ações',
                        ].map((h) => (
                          <th
                            key={h}
                            className={cn(
                              'px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400',
                              h === 'Ações' && 'text-right',
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((t) => (
                        <tr
                          key={t.id}
                          className="border-t border-slate-100 transition-colors hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-700/30"
                        >
                          <td className="max-w-[260px] px-4 py-3">
                            <p className="line-clamp-2 font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-4 py-3">
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td className="px-4 py-3">
                            <TypeBadge kind={t.ticket_type ?? 'OTHER'} />
                          </td>
                          <td className="max-w-[160px] px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            <p className="truncate">{t.requester?.name ?? '—'}</p>
                          </td>
                          <td className="max-w-[160px] px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            <p className="truncate">{t.assigned_to?.name ?? '—'}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {formatTicketDate(t.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">{renderTicketActions(t)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </SupportDeskPageShell>
  );
}
