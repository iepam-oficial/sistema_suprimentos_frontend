'use client';

import { Button, Center, Text, VStack } from '@chakra-ui/react';
import { ClipboardList } from 'lucide-react';

interface PurchaseRequestEmptyStateProps {
  onCreate: () => void;
}

export function PurchaseRequestEmptyState({ onCreate }: PurchaseRequestEmptyStateProps) {
  return (
    <Center flex="1" py={12}>
      <VStack spacing={4}>
        <ClipboardList size={48} strokeWidth={1.25} opacity={0.45} />
        <Text color="gray.500" textAlign="center">
          Nenhuma solicitação de compra encontrada.
        </Text>
        <Button colorScheme="blue" size="sm" onClick={onCreate}>
          Criar primeira solicitação
        </Button>
      </VStack>
    </Center>
  );
}
