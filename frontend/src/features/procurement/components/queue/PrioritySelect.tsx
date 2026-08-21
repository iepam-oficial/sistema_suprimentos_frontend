'use client';

import { useState } from 'react';
import { FormControl, FormLabel, Select, useToast } from '@chakra-ui/react';
import type { PurchaseRequestDTO, PurchaseRequestPriority } from '@ti-assistant/contracts';
import { updatePurchaseRequestPriority } from '../../api/purchaseRequestApi';
import { purchaseRequestPriorityLabel } from '../../types';

import { hasAnyRole } from '@ti-assistant/contracts/dist/roles';

const PRIORITIES: PurchaseRequestPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

interface PrioritySelectProps {
  purchaseRequestId: string;
  currentPriority: PurchaseRequestPriority;
  userRoles: readonly string[];
  disabled?: boolean;
  onUpdated?: (updated: PurchaseRequestDTO) => void;
}

export function PrioritySelect({
  purchaseRequestId,
  currentPriority,
  userRoles,
  disabled = false,
  onUpdated,
}: PrioritySelectProps) {
  const toast = useToast();
  const [priority, setPriority] = useState(currentPriority);
  const [saving, setSaving] = useState(false);

  if (!hasAnyRole(userRoles, 'MANAGER', 'ADMIN')) {
    return null;
  }

  const handleChange = async (next: PurchaseRequestPriority) => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    const previous = priority;
    setPriority(next);
    setSaving(true);

    try {
      const updated = await updatePurchaseRequestPriority(token, purchaseRequestId, { priority: next });
      onUpdated?.(updated);
      toast({
        title: 'Prioridade atualizada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setPriority(previous);
      toast({
        title: 'Erro ao atualizar prioridade',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormControl maxW="240px" isDisabled={disabled || saving}>
      <FormLabel fontSize="sm">Prioridade</FormLabel>
      <Select
        size="sm"
        value={priority}
        onChange={(e) => handleChange(e.target.value as PurchaseRequestPriority)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {purchaseRequestPriorityLabel(p)}
          </option>
        ))}
      </Select>
    </FormControl>
  );
}
