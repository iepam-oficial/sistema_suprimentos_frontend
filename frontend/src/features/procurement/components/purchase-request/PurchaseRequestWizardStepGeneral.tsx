'use client';

import {
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import type { PurchaseRequestWizardForm } from './purchaseRequestWizardTypes';

interface PurchaseRequestWizardStepGeneralProps {
  form: PurchaseRequestWizardForm;
  onChange: (form: PurchaseRequestWizardForm) => void;
  isDisabled?: boolean;
}

export function PurchaseRequestWizardStepGeneral({
  form,
  onChange,
  isDisabled = false,
}: PurchaseRequestWizardStepGeneralProps) {
  return (
    <VStack align="stretch" spacing={4}>
      <FormControl isRequired>
        <FormLabel>Justificativa</FormLabel>
        <Textarea
          value={form.justification}
          onChange={(e) => onChange({ ...form, justification: e.target.value })}
          placeholder="Descreva a necessidade da compra"
          isDisabled={isDisabled}
          rows={4}
        />
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired>
          <FormLabel>Destino da entrega</FormLabel>
          <Input
            value={form.destination}
            onChange={(e) => onChange({ ...form, destination: e.target.value })}
            placeholder="Ex.: Secretaria, Sala 12"
            isDisabled={isDisabled}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Prazo de entrega</FormLabel>
          <Input
            type="date"
            value={form.delivery_deadline}
            onChange={(e) => onChange({ ...form, delivery_deadline: e.target.value })}
            isDisabled={isDisabled}
          />
        </FormControl>
      </SimpleGrid>

      <FormControl>
        <FormLabel>Observações</FormLabel>
        <Textarea
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          placeholder="Informações adicionais (opcional)"
          isDisabled={isDisabled}
          rows={2}
        />
      </FormControl>
    </VStack>
  );
}
