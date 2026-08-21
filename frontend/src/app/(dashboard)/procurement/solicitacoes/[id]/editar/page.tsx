'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PurchaseRequestWizard } from '@/features/procurement/components/purchase-request/PurchaseRequestWizard';
import { SC_PAGE_ROLES } from '@/features/procurement/lib/purchaseRequestAccess';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

export default function EditPurchaseRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const access = assertPageAccess(resolveUserRoles(user), SC_PAGE_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <PurchaseRequestWizard mode="edit" id={id} />;
}
