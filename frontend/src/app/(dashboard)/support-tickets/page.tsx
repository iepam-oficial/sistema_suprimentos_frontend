'use client';

import { useEffect, useState } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';
import { canUseSupportTicketsKanban } from './types';
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
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (userRole && canUseSupportTicketsKanban(userRole)) {
    return <AdminSupportDeskView />;
  }

  return <SupportTicketsLegacyListView />;
}
