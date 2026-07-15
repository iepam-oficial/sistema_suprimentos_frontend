'use client';

import { ViewportPageShell } from '@/components/layout';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <ViewportPageShell>{children}</ViewportPageShell>;
}
