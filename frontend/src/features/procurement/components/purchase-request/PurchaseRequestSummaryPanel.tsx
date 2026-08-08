'use client';

import {
  Box,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';

function requesterName(request: PurchaseRequestDTO): string {
  const user = request.created_by;
  if (user && typeof user === 'object' && 'name' in user && user.name) {
    return user.name;
  }
  return '—';
}

interface PurchaseRequestSummaryPanelProps {
  request: PurchaseRequestDTO;
  emphasized?: boolean;
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <VStack align="stretch" spacing={0}>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontSize="sm">{value}</Text>
    </VStack>
  );
}

function EmphasizedJustificationField({ label, value }: { label: string; value: string }) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bg = useColorModeValue('gray.50', 'gray.700');

  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Box p={3} bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="md">
        <Text fontSize="md">{value}</Text>
      </Box>
    </VStack>
  );
}

function formatDeadline(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

export function PurchaseRequestSummaryPanel({
  request,
  emphasized = false,
}: PurchaseRequestSummaryPanelProps) {
  return (
    <VStack align="stretch" spacing={4}>
      <SummaryField label="Solicitante" value={requesterName(request)} />
      {emphasized ? (
        <EmphasizedJustificationField label="Justificativa" value={request.justification} />
      ) : (
        <SummaryField label="Justificativa" value={request.justification} />
      )}
      <SummaryField
        label="Destino da entrega"
        value={request.destination?.trim() || '—'}
      />
      <SummaryField
        label="Prazo de entrega"
        value={formatDeadline(request.delivery_deadline)}
      />
      {request.notes && <SummaryField label="Observações" value={request.notes} />}
      <SummaryField
        label="Criada em"
        value={new Date(request.created_at).toLocaleString('pt-BR')}
      />
      <SummaryField
        label="Atualizada em"
        value={new Date(request.updated_at).toLocaleString('pt-BR')}
      />
    </VStack>
  );
}
