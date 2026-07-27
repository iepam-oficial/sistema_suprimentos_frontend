import { statusLabel } from '@/features/support-tickets/types';
import { cn } from './cn';

const STATUS_CLASSES: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
  IN_PROGRESS:
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
  RESOLVED:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-800 border-slate-200',
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
