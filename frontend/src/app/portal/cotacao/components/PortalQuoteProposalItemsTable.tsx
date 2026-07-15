'use client';

import {
  Input,
  NumberInput,
  NumberInputField,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import type { SubmitProcurementProposalItemInput } from '@ti-assistant/contracts';
import { CurrencyInput } from '@/components/CurrencyInput';
import { StickyDataTable, useGlassTokens } from '@/components/layout';
import { formatBRL, mulMoney } from '@/utils/money';

interface PortalQuoteProposalItemsTableProps {
  items: SubmitProcurementProposalItemInput[];
  onUpdateItem: (
    index: number,
    field: keyof SubmitProcurementProposalItemInput,
    value: string | number,
  ) => void;
}

export function PortalQuoteProposalItemsTable({
  items,
  onUpdateItem,
}: PortalQuoteProposalItemsTableProps) {
  const { headingColor } = useGlassTokens();

  return (
    <>
      <Text fontSize="sm" fontWeight="semibold" color={headingColor} mb={2} px={1} mt={3}>
        Itens da proposta
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
          {items.map((item, index) => (
            <Tr key={`proposal-${index}`}>
              <Td maxW="200px">
                <Input
                  size="sm"
                  value={item.description}
                  onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
                />
              </Td>
              <Td isNumeric>
                <NumberInput
                  size="sm"
                  min={1}
                  value={item.quantity}
                  onChange={(_, value) =>
                    onUpdateItem(
                      index,
                      'quantity',
                      Number.isFinite(value) ? Math.round(value) : 1,
                    )
                  }
                >
                  <NumberInputField textAlign="right" />
                </NumberInput>
              </Td>
              <Td isNumeric>
                <CurrencyInput
                  value={item.unit_price}
                  onChange={(value) => onUpdateItem(index, 'unit_price', value)}
                  textAlign="right"
                />
              </Td>
              <Td isNumeric whiteSpace="nowrap">
                {formatBRL(mulMoney(item.unit_price, item.quantity))}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </StickyDataTable>
    </>
  );
}
