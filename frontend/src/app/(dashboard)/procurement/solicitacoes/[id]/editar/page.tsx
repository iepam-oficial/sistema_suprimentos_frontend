'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PurchaseRequestWizard } from '@/features/procurement/components/purchase-request/PurchaseRequestWizard';

const ALLOWED_ROLES = ['COORDINATOR', 'ADMIN'];

export default function EditPurchaseRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <PurchaseRequestWizard mode="edit" id={id} />;
}
