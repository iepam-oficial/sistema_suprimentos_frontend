import { Ticket, FolderOpen, Loader, CheckCircle2 } from 'lucide-react';
import { cn } from './cn';

export const STAT_ICONS = {
  total: { icon: Ticket, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  open: { icon: FolderOpen, bg: 'bg-orange-50 dark:bg-orange-900/30', color: 'text-orange-600 dark:text-orange-400' },
  progress: { icon: Loader, bg: 'bg-purple-50 dark:bg-purple-900/30', color: 'text-purple-600 dark:text-purple-400' },
  resolved: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
} as const;

export type StatCardVariant = keyof typeof STAT_ICONS;

export function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: StatCardVariant;
}) {
  const { icon: Icon, bg, color } = STAT_ICONS[variant];
  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className={cn('mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', bg, color)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
