'use client';

import { Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import type { PortalPurchaseOrderContextDTO } from '@ti-assistant/contracts';
import { StickyDataTable, useGlassTokens } from '@/components/layout';
import { formatBRL } from './portalPedidoUtils';

interface PortalOrderItemsTableProps {
  items: PortalPurchaseOrderContextDTO['items'];
}

export function PortalOrderItemsTable({ items }: PortalOrderItemsTableProps) {
  const { headingColor } = useGlassTokens();

  return (
    <>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor} mb={2} px={1}>
        Itens do pedido
      </Text>
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
          {items.map((item) => (
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
    </>
  );
}
