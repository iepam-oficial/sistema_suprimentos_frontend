import { priorityLabel } from '@/features/support-tickets/types';
import { cn } from './cn';

const PRIORITY_CLASSES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200',
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        PRIORITY_CLASSES[priority] ?? PRIORITY_CLASSES.MEDIUM,
        className,
      )}
    >
      {priorityLabel(priority)}
    </span>
  );
}
