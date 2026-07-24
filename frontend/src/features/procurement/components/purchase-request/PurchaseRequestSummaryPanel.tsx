'use client';

import {
  Badge,
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

function chartOfAccountLabel(request: PurchaseRequestDTO): string {
  if (request.chart_of_account) {
    return `${request.chart_of_account.codigo} — ${request.chart_of_account.nome}`;
  }
  return request.chart_of_account_id || '—';
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

function EmphasizedChartOfAccountField({ label, value }: { label: string; value: string }) {
  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Badge
        colorScheme="blue"
        fontSize="sm"
        px={3}
        py={1.5}
        borderRadius="md"
        whiteSpace="normal"
        textAlign="left"
        maxW="100%"
        alignSelf="flex-start"
      >
        {value}
      </Badge>
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

export function PurchaseRequestSummaryPanel({
  request,
  emphasized = false,
}: PurchaseRequestSummaryPanelProps) {
  const chartLabel = chartOfAccountLabel(request);

  return (
    <VStack align="stretch" spacing={4}>
      <SummaryField label="Solicitante" value={requesterName(request)} />
      {emphasized ? (
        <EmphasizedChartOfAccountField label="Plano de contas" value={chartLabel} />
      ) : (
        <SummaryField label="Plano de contas" value={chartLabel} />
      )}
      {emphasized ? (
        <EmphasizedJustificationField label="Justificativa" value={request.justification} />
      ) : (
        <SummaryField label="Justificativa" value={request.justification} />
      )}
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
