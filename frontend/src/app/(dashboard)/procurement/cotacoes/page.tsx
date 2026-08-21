'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  useColorModeValue,
  useDisclosure,
  useMediaQuery,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ProcurementQuoteList,
  ProcurementQuoteWizard,
  usePollingRefresh,
  useProcurementQuotes,
  usePurchaseRequests,
  useMarkMenuBadgeSeen,
} from '@/features/procurement';
import { resolveInitialPurchaseRequestId } from '@/features/procurement/utils/quoteWizardEligibility';

import { getHighestPriorityRole } from '@ti-assistant/contracts/dist/roles';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

const ALLOWED_ROLES = ['MANAGER', 'DIRECTOR', 'ADMIN'];
const MANAGER_ROLES = ['MANAGER', 'ADMIN'];

export default function ProcurementQuotesPage() {
  return (
    <Suspense fallback={null}>
      <ProcurementQuotesPageContent />
    </Suspense>
  );
}

function ProcurementQuotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isWizardOpen, onOpen: openWizard, onClose: closeWizard } = useDisclosure();
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialPurchaseRequestId, setInitialPurchaseRequestId] = useState<string | undefined>();
  const { items, loading, error, reload, refreshSilent } = useProcurementQuotes();
  const {
    items: openScItems,
    loading: openScLoading,
    error: openScError,
    refreshSilent: refreshOpenScSilent,
  } = usePurchaseRequests({ awaiting_quote: true, limit: 100 });

  usePollingRefresh({
    enabled: authorized && !isWizardOpen,
    onTick: () => {
      void refreshSilent();
      void refreshOpenScSilent();
    },
  });

  useMarkMenuBadgeSeen('cotacoes', authorized);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const roles = resolveUserRoles(user);
    const access = assertPageAccess(roles, ALLOWED_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setUserRole(getHighestPriorityRole(roles));
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar cotações',
        description: error,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (!authorized || !userRole || !MANAGER_ROLES.includes(userRole)) {
      return;
    }

    const newQuoteId = searchParams.get('newQuote');
    if (!newQuoteId) {
      return;
    }

    if (openScLoading) {
      return;
    }

    if (openScError) {
      toast({
        title: 'Não foi possível validar a SC',
        description: openScError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      router.replace('/procurement/cotacoes');
      return;
    }

    const resolved = resolveInitialPurchaseRequestId(newQuoteId, openScItems);
    if (resolved.invalid || !resolved.id) {
      toast({
        title: 'SC não disponível para cotação',
        description:
          'A solicitação informada não está em aberto aguardando cotação. Ela pode já ter cotação, não estar aprovada ou não existir.',
        status: 'warning',
        duration: 6000,
        isClosable: true,
      });
      router.replace('/procurement/cotacoes');
      return;
    }

    setInitialPurchaseRequestId(resolved.id);
    openWizard();
    router.replace('/procurement/cotacoes');
  }, [
    authorized,
    userRole,
    searchParams,
    openWizard,
    openScLoading,
    openScError,
    openScItems,
    toast,
    router,
  ]);

  const handleWizardSuccess = (quoteId: string) => {
    closeWizard();
    setInitialPurchaseRequestId(undefined);
    reload();
    router.push(`/procurement/cotacoes/${quoteId}`);
  };

  const handleWizardCancel = useCallback(() => {
    closeWizard();
    setInitialPurchaseRequestId(undefined);
    if (searchParams.get('newQuote')) {
      router.replace('/procurement/cotacoes');
    }
  }, [closeWizard, searchParams, router]);

  const isManager = userRole != null && MANAGER_ROLES.includes(userRole);
  const canCreateQuote =
    isManager && !openScLoading && !openScError && openScItems.length > 0;

  if (!authorized) {
    return null;
  }

  return (
    <Box w="full" h="full">
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        h="full"
      >
        {!isMobile && (
          <>
            <Flex justify="space-between" align="center" gap={3}>
              <Heading size="lg" color={headingColor}>
                Cotações de Compras
              </Heading>
              {!isWizardOpen && isManager && (
                <Button
                  leftIcon={<Plus size={18} />}
                  colorScheme="blue"
                  onClick={openWizard}
                  isDisabled={!canCreateQuote}
                  title={
                    canCreateQuote
                      ? undefined
                      : 'Nenhuma SC em aberto aguardando cotação'
                  }
                >
                  Nova cotação
                </Button>
              )}
            </Flex>
            <Divider />
          </>
        )}

        {isMobile && !isWizardOpen && isManager && (
          <Button
            leftIcon={<Plus size={18} />}
            colorScheme="blue"
            onClick={openWizard}
            size="sm"
            isDisabled={!canCreateQuote}
            title={
              canCreateQuote ? undefined : 'Nenhuma SC em aberto aguardando cotação'
            }
          >
            Nova cotação
          </Button>
        )}

        {isWizardOpen && isManager && (
          <Box>
            <Heading size="md" mb={4} color={headingColor}>
              Nova cotação de compra
            </Heading>
            <ProcurementQuoteWizard
              onSuccess={handleWizardSuccess}
              onCancel={handleWizardCancel}
              initialPurchaseRequestId={initialPurchaseRequestId}
            />
            <Divider my={6} />
          </Box>
        )}

        <ProcurementQuoteList
          items={items}
          loading={loading}
          onReload={reload}
          canSend={isManager}
        />
      </VStack>
    </Box>
  );
}
