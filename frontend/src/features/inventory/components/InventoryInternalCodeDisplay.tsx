import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';

import { generateInventoryInternalCode } from '@/features/inventory/api/inventoryApi';
import type { InventoryItem } from '@/features/inventory/types';
import { isDottedHierarchicalInternalCode } from '@/utils/internalCode';

interface InventoryInternalCodeDisplayProps {
  inventoryId: string;
  internalCode: string | null | undefined;
  token: string;
  onGenerated: (item: InventoryItem) => void;
  variant?: 'list' | 'modal';
}

export function InventoryInternalCodeDisplay({
  inventoryId,
  internalCode,
  token,
  onGenerated,
  variant = 'list',
}: InventoryInternalCodeDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const dto = await generateInventoryInternalCode(token, inventoryId);
      onGenerated(dto);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Erro ao gerar código interno',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDotted =
    internalCode != null && isDottedHierarchicalInternalCode(internalCode);
  const actionLabel = internalCode ? 'Atualizar código' : 'Gerar código';

  if (variant === 'modal') {
    return (
      <FormControl>
        <FormLabel>Código PAT</FormLabel>
        {isDotted ? (
          <Input isReadOnly value={internalCode} />
        ) : (
          <Button
            size="sm"
            onClick={handleGenerate}
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {actionLabel}
          </Button>
        )}
      </FormControl>
    );
  }

  if (isDotted) {
    return (
      <Text fontSize="xs" color="gray.500" fontFamily="mono">
        {internalCode}
      </Text>
    );
  }

  return (
    <Button
      size="xs"
      variant="link"
      onClick={handleGenerate}
      isLoading={isLoading}
      isDisabled={isLoading}
    >
      {actionLabel}
    </Button>
  );
}
