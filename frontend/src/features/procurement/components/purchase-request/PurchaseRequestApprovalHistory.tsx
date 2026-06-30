'use client';

import { Text, VStack } from '@chakra-ui/react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import type { PurchaseRequestApprovalDTO } from '@ti-assistant/contracts';

function approvalActionLabel(action: string): string {
  const labels: Record<string, string> = {
    APPROVE: 'Aprovado',
    REJECT: 'Rejeitado',
    SUBMIT: 'Enviado',
  };
  return labels[action] ?? action;
}

function approverName(approval: PurchaseRequestApprovalDTO): string {
  const user = approval.approved_by;
  if (user && typeof user === 'object' && 'name' in user && user.name) {
    return user.name;
  }
  return 'Usuário';
}

interface PurchaseRequestApprovalHistoryProps {
  approvals: PurchaseRequestDTO['approvals'];
}

export function PurchaseRequestApprovalHistory({ approvals }: PurchaseRequestApprovalHistoryProps) {
  if (approvals.length === 0) {
    return null;
  }

  return (
    <VStack align="stretch" spacing={2}>
      <Text fontSize="sm" fontWeight="semibold">
        Histórico de aprovação
      </Text>
      {approvals.map((approval) => (
        <VStack
          key={approval.id}
          align="stretch"
          spacing={1}
          p={3}
          borderWidth="1px"
          borderRadius="md"
        >
          <Text fontSize="sm">
            <strong>{approverName(approval)}</strong> — {approvalActionLabel(approval.action)}
          </Text>
          {approval.reason && (
            <Text fontSize="sm" color="gray.500">
              {approval.reason}
            </Text>
          )}
          <Text fontSize="xs" color="gray.400">
            {new Date(approval.approved_at).toLocaleString('pt-BR')}
          </Text>
        </VStack>
      ))}
    </VStack>
  );
}
