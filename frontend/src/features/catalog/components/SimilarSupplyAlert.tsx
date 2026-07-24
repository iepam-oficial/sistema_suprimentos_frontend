import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useRef } from 'react';

import type { SupplyDTO } from '@/features/catalog/types';

interface SimilarSupplyAlertProps {
  isOpen: boolean;
  supplies: SupplyDTO[];
  onSelectExisting: (supply: SupplyDTO) => void;
  onContinueCreate: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SimilarSupplyAlert({
  isOpen,
  supplies,
  onSelectExisting,
  onContinueCreate,
  onCancel,
  isLoading = false,
}: SimilarSupplyAlertProps) {
  const leastDestructiveRef = useRef<HTMLButtonElement>(null);
  const visibleSupplies = supplies.slice(0, 5);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={leastDestructiveRef}
      onClose={onCancel}
    >
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader>Suprimentos semelhantes encontrados</AlertDialogHeader>
        <AlertDialogBody>
          <VStack align="stretch" spacing={3}>
            {visibleSupplies.map((supply) => (
              <HStack key={supply.id} justify="space-between" spacing={3}>
                <Text flex={1}>
                  {supply.name}
                  {supply.unit ? ` (${supply.unit.symbol || supply.unit.name})` : ''}
                </Text>
                <Button
                  size="sm"
                  onClick={() => onSelectExisting(supply)}
                  isDisabled={isLoading}
                >
                  Usar este
                </Button>
              </HStack>
            ))}
          </VStack>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={leastDestructiveRef} onClick={onCancel} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button colorScheme="purple" onClick={onContinueCreate} isDisabled={isLoading} ml={3}>
            Continuar cadastro
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
