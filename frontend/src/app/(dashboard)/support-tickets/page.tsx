'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { canUseAdminSupportDesk } from './types';
import { AdminSupportDeskView } from './AdminSupportDeskView';
import { SupportTicketsLegacyListView } from './SupportTicketsLegacyListView';
import { resolveUserRoles } from '@/utils/pageAccess';

export default function SupportTicketsPage() {
  const [userRoles, setUserRoles] = useState<string[] | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (userRaw) {
      const user = JSON.parse(userRaw) as { roles?: string[]; role?: string };
      setUserRoles(resolveUserRoles(user));
    } else {
      setUserRoles([]);
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

  if (userRoles && canUseAdminSupportDesk(userRoles)) {
    return <AdminSupportDeskView />;
  }

  return <SupportTicketsLegacyListView />;
}
