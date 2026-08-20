'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  PurchaseRequestFiltersDrawer,
  PurchaseRequestListTable,
  PurchaseRequestPageShell,
  PurchaseRequestToolbar,
  usePollingRefresh,
  usePurchaseRequestFilters,
  usePurchaseRequests,
  useMarkMenuBadgeSeen,
} from '@/features/procurement';
import { SC_PAGE_ROLES } from '@/features/procurement/lib/purchaseRequestAccess';

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const toast = useToast();
  const [authorized, setAuthorized] = useState(false);
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();

  const {
    search,
    setSearch,
    drawerFilters,
    setDrawerFilters,
    clearDrawerFilters,
    filtersActive,
    apiFilters,
    filterItems,
  } = usePurchaseRequestFilters();

  const stableApiFilters = useMemo(() => apiFilters, [JSON.stringify(apiFilters)]);

  const { items, loading, error, refreshSilent } = usePurchaseRequests(stableApiFilters);
  const displayedItems = useMemo(() => filterItems(items), [items, filterItems]);

  usePollingRefresh({
    enabled: authorized && !isFilterOpen,
    onTick: refreshSilent,
  });

  useMarkMenuBadgeSeen('solicitacoes', authorized);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !SC_PAGE_ROLES.includes(user.role as (typeof SC_PAGE_ROLES)[number])) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar solicitações',
        description: error,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const goToNew = () => router.push('/procurement/solicitacoes/nova');

  if (!authorized) {
    return null;
  }

  return (
    <>
      <PurchaseRequestPageShell
        toolbar={
          <PurchaseRequestToolbar
            search={search}
            onSearchChange={setSearch}
            filtersActive={filtersActive}
            onOpenFilters={onFilterOpen}
            onNewRequest={goToNew}
          />
        }
      >
        <PurchaseRequestListTable
          items={displayedItems}
          loading={loading}
          onCreate={goToNew}
        />
      </PurchaseRequestPageShell>

      <PurchaseRequestFiltersDrawer
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        filters={drawerFilters}
        onChange={setDrawerFilters}
        onClear={() => {
          clearDrawerFilters();
          onFilterClose();
        }}
      />
    </>
  );
}
