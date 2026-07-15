'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'next/navigation';
import {
  GeneratePurchaseOrderModal,
  PurchaseOrderList,
  usePollingRefresh,
  usePurchaseOrders,
  useMarkMenuBadgeSeen,
} from '@/features/procurement';

const ALLOWED_ROLES = ['MANAGER', 'ADMIN'];

export default function ProcurementPurchaseOrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [authorized, setAuthorized] = useState(false);
  const { items, loading, error, reload, refreshSilent } = usePurchaseOrders();

  usePollingRefresh({
    enabled: authorized && !isModalOpen,
    onTick: refreshSilent,
  });

  useMarkMenuBadgeSeen('pedidos', authorized);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');

  const existingQuoteIds = useMemo(
    () => items.map((item) => item.procurement_quote_id),
    [items]
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: error,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [error, toast]);

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
                Pedidos de Compra
              </Heading>
              <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={openModal}>
                Gerar pedido
              </Button>
            </Flex>
            <Divider />
          </>
        )}

        {isMobile && (
          <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={openModal} size="sm">
            Gerar pedido
          </Button>
        )}

        <PurchaseOrderList items={items} loading={loading} onReload={reload} canManage />

        <GeneratePurchaseOrderModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={reload}
          existingQuoteIds={existingQuoteIds}
        />
      </VStack>
    </Box>
  );
}
