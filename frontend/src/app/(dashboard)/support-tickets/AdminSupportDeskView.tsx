'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSupportTicketsFetch } from '@/features/support-tickets/hooks/useSupportTicketsFetch';
import { SupportTicketDeskModal } from './SupportTicketDeskModal';
import {
  SupportTicket,
  formatTicketDate,
  ticketMatchesSearch,
  ticketTypeLabel,
  shortTicketId,
} from './types';
import { StatusBadge } from '@/components/support-desk/StatusBadge';
import { PriorityBadge } from '@/components/support-desk/PriorityBadge';
import { StatCard } from '@/components/support-desk/StatCard';
import { FilterChip } from '@/components/support-desk/FilterChip';
import { SupportDeskPageShell } from '@/components/support-desk/SupportDeskPageShell';
import { DeskEmptyState } from '@/components/support-desk/DeskEmptyState';
import { computeTicketStats } from '@/components/support-desk/ticketStats';
import { cn } from '@/components/support-desk/cn';
import { inputClass } from '@/components/support-desk/formClasses';

type DeskFilter = 'all' | 'open' | 'resolved';

export function AdminSupportDeskView() {
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deskFilter, setDeskFilter] = useState<DeskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalTicketId, setModalTicketId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { tickets, setTickets, initialLoading, filtersLoading, error, userRoles } = useSupportTicketsFetch({
    priorityFilter,
    fetchAllStatuses: true,
  });

  useEffect(() => {
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (userRaw) {
      const u = JSON.parse(userRaw) as { id?: string };
      setUserId(u.id ?? null);
    }
  }, []);

  const stats = useMemo(() => computeTicketStats(tickets), [tickets]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (deskFilter === 'open') {
      list = list.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    } else if (deskFilter === 'resolved') {
      list = list.filter((t) => t.status === 'RESOLVED');
    }
    if (searchQuery.trim()) {
      list = list.filter((t) => ticketMatchesSearch(t, searchQuery));
    }
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [tickets, deskFilter, searchQuery]);

  const handleTicketUpdated = (updated: SupportTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTicketDeleted = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setModalTicketId(null);
  };

  const headerRight = (
    <>
      <div className="relative min-w-0 flex-1 sm:min-w-[200px] lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Buscar chamados..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(inputClass, 'w-full py-2 pl-9')}
        />
      </div>
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
    <>
      <SupportDeskPageShell title="Visão geral dos chamados" headerRight={headerRight}>
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
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Chamados recentes</h2>
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={deskFilter === 'all'} onClick={() => setDeskFilter('all')}>
                    Todos
                  </FilterChip>
                  <FilterChip active={deskFilter === 'open'} onClick={() => setDeskFilter('open')}>
                    Abertos
                  </FilterChip>
                  <FilterChip active={deskFilter === 'resolved'} onClick={() => setDeskFilter('resolved')}>
                    Resolvidos
                  </FilterChip>
                </div>
              </div>

              {filteredTickets.length === 0 ? (
                <DeskEmptyState />
              ) : (
                <>
                  <div className={cn('space-y-3 p-4 md:hidden', filtersLoading && 'opacity-60')}>
                    {filteredTickets.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setModalTicketId(t.id)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-600 dark:bg-slate-800"
                      >
                        <p className="mb-1 font-mono text-xs text-slate-500">#{shortTicketId(t.id)}</p>
                        <p className="mb-2 line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {t.subject}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge status={t.status} />
                          <PriorityBadge priority={t.priority} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className={cn('hidden overflow-x-auto md:block', filtersLoading && 'opacity-60')}>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          {['ID', 'Assunto', 'Solicitante', 'Prioridade', 'Status', 'Data', 'Ação'].map((h) => (
                            <th
                              key={h}
                              className={cn(
                                'px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400',
                                h === 'Ação' && 'text-right',
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
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{shortTicketId(t.id)}</td>
                            <td className="max-w-[240px] px-4 py-3">
                              <p className="truncate font-medium text-slate-800 dark:text-slate-100">{t.subject}</p>
                              <p className="truncate text-xs text-slate-500">
                                {ticketTypeLabel(t.ticket_type ?? 'OTHER')}
                              </p>
                            </td>
                            <td className="max-w-[160px] px-4 py-3">
                              <p className="truncate">{t.requester?.name ?? '—'}</p>
                              <p className="truncate text-xs text-slate-500">
                                {[t.location?.name, t.sector?.name].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <PriorityBadge priority={t.priority} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={t.status} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                              {formatTicketDate(t.created_at).split(',')[0]}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setModalTicketId(t.id)}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                              >
                                Ver detalhes
                              </button>
                            </td>
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

      <SupportTicketDeskModal
        ticketId={modalTicketId}
        isOpen={!!modalTicketId}
        onClose={() => setModalTicketId(null)}
        userRoles={userRoles}
        userId={userId}
        onTicketUpdated={handleTicketUpdated}
        onTicketDeleted={handleTicketDeleted}
      />
    </>
  );
}
