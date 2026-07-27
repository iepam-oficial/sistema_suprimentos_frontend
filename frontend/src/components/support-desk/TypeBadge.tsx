import { ticketTypeLabel } from '@/features/support-tickets/types';
import { cn } from './cn';

const TYPE_CLASSES: Record<string, string> = {
  INCIDENT: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200',
  SERVICE_REQUEST: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200',
  QUESTION: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200',
  OTHER: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200',
};

export function TypeBadge({ kind, className }: { kind: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        TYPE_CLASSES[kind] ?? TYPE_CLASSES.OTHER,
        className,
      )}
    >
      {ticketTypeLabel(kind)}
    </span>
  );
}
