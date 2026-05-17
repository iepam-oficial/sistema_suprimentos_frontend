import { FolderOpen } from 'lucide-react';

export function DeskEmptyState({
  title = 'Nenhum chamado encontrado',
  description = 'Não há chamados correspondentes ao filtro atual.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <FolderOpen size={28} className="text-slate-400" />
      </div>
      <p className="font-medium text-slate-800 dark:text-slate-100">{title}</p>
      <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
