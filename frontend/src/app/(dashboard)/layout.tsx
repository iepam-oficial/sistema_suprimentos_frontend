'use client';

import { ProcurementMenuBadgesProvider } from '@/features/procurement';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Não mostrar o sidebar nas páginas de login e registro
  if (pathname === '/' || pathname === '/register' || pathname === '/') {
    return children;
  }

  return (
    <ProcurementMenuBadgesProvider>
      <Sidebar>{children}</Sidebar>
    </ProcurementMenuBadgesProvider>
  );
}
