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
  const methods = proposal.payment_methods ?? [];
  const hasBoleto = methods.some((m) => m.requires_boleto_terms);

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
        <HStack justify="space-between" align="flex-start">
          <Text color={mutedColor}>Formas de pagamento aceitas</Text>
          <Text color={headingColor} textAlign="right">
            {methods.length > 0
              ? methods.map((m) => m.label).join(', ')
              : '—'}
          </Text>
        </HStack>
        {hasBoleto && (
          <HStack justify="space-between">
            <Text color={mutedColor}>Boleto a prazo</Text>
            <Text color={headingColor}>
              Carência {proposal.boleto_grace_days ?? '—'} dias ·{' '}
              {proposal.boleto_installments ?? '—'}x (a cada 30 dias)
            </Text>
          </HStack>
        )}
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
