'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Center,
  Flex,
  Heading,
  Spinner,
  Text,
  useBreakpointValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { PortalPurchaseOrderContextDTO } from '@ti-assistant/contracts';
import {
  fetchPortalPurchaseOrder,
  respondPortalPurchaseOrder,
} from '@/features/procurement/api/portalPurchaseOrderApi';
import {
  GlassPanel,
  GlassScrollArea,
  PortalActionBar,
  useGlassTokens,
} from '@/components/layout';
import {
  PortalOrderAcceptPanel,
  PortalOrderHeader,
  PortalOrderItemsTable,
  PortalOrderSummary,
} from '../components';

export default function PortalPedidoScreen() {
  const params = useParams();
  const token = params.token as string;
  const toast = useToast();
  const { mutedColor, headingColor } = useGlassTokens();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [context, setContext] = useState<PortalPurchaseOrderContextDTO | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const data = await fetchPortalPurchaseOrder(token);
      setContext(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('inválido')) {
        setNotFound(true);
      } else {
        toast({
          title: 'Erro ao carregar pedido',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) {
      loadOrder();
    }
  }, [token, loadOrder]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const data = await respondPortalPurchaseOrder(token, { action: 'accept' });
      setContext(data);
      toast({
        title: 'Pedido aceito',
        description: 'Obrigado pela confirmação.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao aceitar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    const trimmedReason = declineReason.trim();
    if (!trimmedReason) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da recusa.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setActionLoading(true);
      const data = await respondPortalPurchaseOrder(token, {
        action: 'decline',
        reason: trimmedReason,
      });
      setContext(data);
      setShowDeclineForm(false);
      toast({
        title: 'Pedido recusado',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao recusar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Center flex="1" minH={0}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (notFound || !context) {
    return (
      <GlassPanel justifyContent="center">
        <Center flex="1" p={8}>
          <VStack spacing={4} textAlign="center">
            <FileText size={48} />
            <Heading size="lg" color={headingColor}>
              Pedido inválido ou expirado
            </Heading>
            <Text color={mutedColor}>
              O link do pedido de compra não é válido ou já expirou. Entre em contato com quem
              enviou o pedido.
            </Text>
          </VStack>
        </Center>
      </GlassPanel>
    );
  }

  const canRespond = context.status === 'SENT';
  const isFinalState = context.status === 'ACCEPTED' || context.status === 'DECLINED';

  const renderMainContent = () => {
    if (context.status === 'ACCEPTED') {
      return (
        <Center flex="1" p={4}>
          <Text color={mutedColor}>
            Você aceitou este pedido de compra. Obrigado pela confirmação.
          </Text>
        </Center>
      );
    }

    if (context.status === 'DECLINED') {
      return (
        <Center flex="1" p={4}>
          <Text color={mutedColor}>Você recusou este pedido de compra.</Text>
        </Center>
      );
    }

    return (
      <>
        {canRespond && (
          <PortalOrderAcceptPanel
            showDeclineForm={showDeclineForm}
            declineReason={declineReason}
            onDeclineReasonChange={setDeclineReason}
          />
        )}
        <PortalOrderItemsTable items={context.items} />
      </>
    );
  };

  const renderActionBar = () => {
    if (!canRespond) return null;

    return (
      <PortalActionBar>
        {showDeclineForm ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeclineForm(false)}
              isDisabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={handleDecline}
              isLoading={actionLoading}
              loadingText="Recusando..."
            >
              Confirmar recusa
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={() => setShowDeclineForm(true)}
              isDisabled={actionLoading}
              data-testid="portal-order-decline"
            >
              Recusar pedido
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={handleAccept}
              isLoading={actionLoading}
              loadingText="Aceitando..."
              data-testid="portal-order-accept"
            >
              Aceitar pedido
            </Button>
          </>
        )}
      </PortalActionBar>
    );
  };

  return (
    <GlassPanel>
      <PortalOrderHeader context={context} />

      {isMobile ? (
        <>
          <PortalOrderSummary context={context} />
          <GlassScrollArea withBorder={false}>{renderMainContent()}</GlassScrollArea>
        </>
      ) : (
        <Flex flex="1" minH={0} gap={2} overflow="hidden">
          <PortalOrderSummary context={context} />
          <GlassScrollArea>{renderMainContent()}</GlassScrollArea>
        </Flex>
      )}

      {!isFinalState && renderActionBar()}
    </GlassPanel>
  );
}
