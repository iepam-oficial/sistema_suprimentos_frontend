'use client';

import { FormControl, FormLabel, Textarea, VStack } from '@chakra-ui/react';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { ChartOfAccountCombobox } from './ChartOfAccountCombobox';
import type { PurchaseRequestWizardForm } from './purchaseRequestWizardTypes';

interface PurchaseRequestWizardStepGeneralProps {
  form: PurchaseRequestWizardForm;
  accounts: ChartOfAccount[];
  onChange: (form: PurchaseRequestWizardForm) => void;
  isDisabled?: boolean;
}

export function PurchaseRequestWizardStepGeneral({
  form,
  accounts,
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

      <FormControl isRequired>
        <FormLabel>Plano de contas</FormLabel>
        <ChartOfAccountCombobox
          accounts={accounts}
          value={form.chartOfAccountId}
          onChange={(chartOfAccountId) => onChange({ ...form, chartOfAccountId })}
          isDisabled={isDisabled}
        />
      </FormControl>

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
