'use client';

import { Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import type { PortalQuoteInviteContextDTO } from '@ti-assistant/contracts';
import { StickyDataTable, useGlassTokens } from '@/components/layout';

interface PortalQuoteItemsTableProps {
  items: PortalQuoteInviteContextDTO['items'];
  title?: string;
}

export function PortalQuoteItemsTable({
  items,
  title = 'Itens solicitados',
}: PortalQuoteItemsTableProps) {
  const { headingColor } = useGlassTokens();

  return (
    <>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor} mb={2} px={1}>
        {title}
      </Text>
      <StickyDataTable>
        <Thead>
          <Tr>
            <Th>Descrição</Th>
            <Th isNumeric>Qtd</Th>
            <Th>Unidade</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item, index) => (
            <Tr key={`${item.description}-${index}`}>
              <Td maxW="300px" isTruncated title={item.description}>
                {item.description}
              </Td>
              <Td isNumeric>{item.quantity}</Td>
              <Td>{item.unit ?? '—'}</Td>
            </Tr>
          ))}
        </Tbody>
      </StickyDataTable>
    </>
  );
}
