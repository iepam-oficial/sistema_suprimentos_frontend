'use client';

import { HStack, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import type { PortalQuoteInviteContextDTO } from '@ti-assistant/contracts';
import { StickyDataTable, useGlassTokens } from '@/components/layout';
import { formatBRL } from './portalQuoteUtils';

interface PortalQuoteSubmittedViewProps {
  proposal: NonNullable<PortalQuoteInviteContextDTO['proposal']>;
}

export function PortalQuoteSubmittedView({ proposal }: PortalQuoteSubmittedViewProps) {
  const { mutedColor, headingColor } = useGlassTokens();

  return (
    <VStack align="stretch" spacing={3} px={1}>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor}>
        Proposta enviada
      </Text>
      <VStack align="stretch" spacing={2} fontSize="sm">
        <HStack justify="space-between">
          <Text color={mutedColor}>Valor total</Text>
          <Text fontWeight="bold" color={headingColor}>
            {formatBRL(proposal.total_value)}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text color={mutedColor}>Prazo de entrega</Text>
          <Text color={headingColor}>{proposal.delivery_days} dias</Text>
        </HStack>
        <HStack justify="space-between">
          <Text color={mutedColor}>Prazo de pagamento</Text>
          <Text color={headingColor}>{proposal.payment_days} dias</Text>
        </HStack>
      </VStack>
      <StickyDataTable>
        <Thead>
          <Tr>
            <Th>Descrição</Th>
            <Th isNumeric>Qtd</Th>
            <Th isNumeric>Preço unit.</Th>
            <Th isNumeric>Total</Th>
          </Tr>
        </Thead>
        <Tbody>
          {proposal.items.map((item) => (
            <Tr key={item.id}>
              <Td maxW="300px" isTruncated title={item.description}>
                {item.description}
              </Td>
              <Td isNumeric>{item.quantity}</Td>
              <Td isNumeric>{formatBRL(item.unit_price)}</Td>
              <Td isNumeric>{formatBRL(item.total_price)}</Td>
            </Tr>
          ))}
        </Tbody>
      </StickyDataTable>
    </VStack>
  );
}
