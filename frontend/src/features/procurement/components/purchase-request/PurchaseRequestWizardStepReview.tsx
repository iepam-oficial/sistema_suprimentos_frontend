'use client';

import {
  Box,
  Divider,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import type { PurchaseRequestWizardForm } from './purchaseRequestWizardTypes';

interface PurchaseRequestWizardStepReviewProps {
  form: PurchaseRequestWizardForm;
}

export function PurchaseRequestWizardStepReview({
  form,
}: PurchaseRequestWizardStepReviewProps) {
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const summaryBg = useColorModeValue('gray.50', 'gray.700');

  const validItems = form.items.filter((item) => item.description.trim() && item.unit.trim());

  return (
    <VStack align="stretch" spacing={4}>
      <Box p={4} bg={summaryBg} borderRadius="md">
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Dados gerais
        </Text>
        <Text fontSize="sm" color={mutedColor}>
          <strong>Justificativa:</strong> {form.justification.trim() || '—'}
        </Text>
        {form.notes.trim() && (
          <Text fontSize="sm" color={mutedColor} mt={2}>
            <strong>Observações:</strong> {form.notes.trim()}
          </Text>
        )}
      </Box>

      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Itens ({validItems.length})
        </Text>
        <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Descrição</Th>
                <Th>Quantidade</Th>
                <Th>Unidade</Th>
              </Tr>
            </Thead>
            <Tbody>
              {validItems.map((item) => (
                <Tr key={item.key}>
                  <Td>{item.description}</Td>
                  <Td>{item.quantity}</Td>
                  <Td>{item.unit}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Divider />
      <Text fontSize="xs" color={mutedColor}>
        Revise os dados antes de submeter. Você também pode salvar como rascunho para continuar depois.
      </Text>
    </VStack>
  );
}
