'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChartOfAccountsEditPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chart-of-accounts');
  }, [router]);

  return null;
}
