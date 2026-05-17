'use client';

export interface SupportDeskPageShellProps {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: '7xl' | '3xl' | '2xl';
}

const MAX_WIDTH_CLASS = {
  '7xl': 'max-w-7xl',
  '3xl': 'max-w-3xl',
  '2xl': 'max-w-2xl',
} as const;

export function SupportDeskPageShell({
  title,
  headerRight,
  children,
  maxWidth = '7xl',
}: SupportDeskPageShellProps) {
  const maxW = MAX_WIDTH_CLASS[maxWidth];

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:px-6">
        <div
          className={`mx-auto flex w-full ${maxW} flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}
        >
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 md:text-2xl">{title}</h1>
          {headerRight ? (
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:justify-end">{headerRight}</div>
          ) : null}
        </div>
      </header>
      <main className={`mx-auto w-full ${maxW} flex-1 overflow-auto px-4 py-6 md:px-6 lg:px-8`}>
        {children}
      </main>
    </div>
  );
}
