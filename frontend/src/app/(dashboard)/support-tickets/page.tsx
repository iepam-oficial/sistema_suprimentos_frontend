'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { canUseAdminSupportDesk } from './types';
import { AdminSupportDeskView } from './AdminSupportDeskView';
import { SupportTicketsLegacyListView } from './SupportTicketsLegacyListView';

export default function SupportTicketsPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (userRaw) {
      const user = JSON.parse(userRaw) as { role?: string };
      setUserRole(user.role ?? '');
    }
    setBooting(false);
  }, []);

  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (userRole && canUseAdminSupportDesk(userRole)) {
    return <AdminSupportDeskView />;
  }

  return <SupportTicketsLegacyListView />;
}
