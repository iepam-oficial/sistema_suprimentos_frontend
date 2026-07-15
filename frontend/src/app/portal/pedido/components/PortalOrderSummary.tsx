'use client';

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import type { PortalPurchaseOrderContextDTO } from '@ti-assistant/contracts';
import { useGlassTokens } from '@/components/layout';
import { formatBRL, formatDate } from './portalPedidoUtils';

interface PortalOrderSummaryProps {
  context: PortalPurchaseOrderContextDTO;
}

function SummaryContent({ context }: PortalOrderSummaryProps) {
  const { mutedColor, headingColor } = useGlassTokens();

  return (
    <VStack align="stretch" spacing={2} fontSize="sm">
      <HStack justify="space-between">
        <Text color={mutedColor}>Cotação de origem</Text>
        <Text fontWeight="medium" color={headingColor}>
          {context.quote_display_code}
        </Text>
      </HStack>
      <HStack justify="space-between">
        <Text color={mutedColor}>Prazo de entrega</Text>
        <Text fontWeight="medium" color={headingColor}>
          {context.delivery_days} dias
        </Text>
      </HStack>
      <HStack justify="space-between">
        <Text color={mutedColor}>Prazo de pagamento</Text>
        <Text fontWeight="medium" color={headingColor}>
          {context.payment_days} dias
        </Text>
      </HStack>
      <HStack justify="space-between">
        <Text color={mutedColor}>Validade do link</Text>
        <Text fontWeight="medium" color={headingColor} textAlign="right" fontSize="xs">
          {formatDate(context.expires_at)}
        </Text>
      </HStack>
      <HStack justify="space-between" pt={1}>
        <Text fontWeight="semibold" color={headingColor}>
          Valor total
        </Text>
        <Text fontWeight="bold" color={headingColor}>
          {formatBRL(context.total_value)}
        </Text>
      </HStack>
    </VStack>
  );
}

export function PortalOrderSummary({ context }: PortalOrderSummaryProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { headingColor } = useGlassTokens();

  if (isMobile) {
    return (
      <Accordion allowToggle defaultIndex={0} flexShrink={0}>
        <AccordionItem border="none">
          <AccordionButton px={1} py={1}>
            <Box flex="1" textAlign="left" fontSize="sm" fontWeight="semibold" color={headingColor}>
              Resumo do pedido
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={1} pb={2}>
            <SummaryContent context={context} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Box w="280px" flexShrink={0} px={1}>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor} mb={2}>
        Resumo
      </Text>
      <SummaryContent context={context} />
    </Box>
  );
}
