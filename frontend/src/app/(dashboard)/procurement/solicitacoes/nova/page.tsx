'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PurchaseRequestWizard } from '@/features/procurement/components/purchase-request/PurchaseRequestWizard';
import { SC_PAGE_ROLES } from '@/features/procurement/lib/purchaseRequestAccess';

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !SC_PAGE_ROLES.includes(user.role as (typeof SC_PAGE_ROLES)[number])) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <PurchaseRequestWizard mode="create" />;
}
