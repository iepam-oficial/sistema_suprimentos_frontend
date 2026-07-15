'use client';

import { Show } from '@chakra-ui/react';
import type { UnitOfMeasureDTO } from '@ti-assistant/contracts';
import { PurchaseRequestItemsCards } from './PurchaseRequestItemsCards';
import { PurchaseRequestItemsTable } from './PurchaseRequestItemsTable';
import type { PurchaseRequestWizardForm } from './purchaseRequestWizardTypes';

interface PurchaseRequestWizardStepItemsProps {
  form: PurchaseRequestWizardForm;
  units: UnitOfMeasureDTO[];
  onChange: (form: PurchaseRequestWizardForm) => void;
  isDisabled?: boolean;
}

export function PurchaseRequestWizardStepItems({
  form,
  units,
  onChange,
  isDisabled = false,
}: PurchaseRequestWizardStepItemsProps) {
  const handleItemsChange = (items: PurchaseRequestWizardForm['items']) => {
    onChange({ ...form, items });
  };

  return (
    <>
      <Show above="md">
        <PurchaseRequestItemsTable
          items={form.items}
          units={units}
          onChange={handleItemsChange}
          isDisabled={isDisabled}
        />
      </Show>
      <Show below="md">
        <PurchaseRequestItemsCards
          items={form.items}
          units={units}
          onChange={handleItemsChange}
          isDisabled={isDisabled}
        />
      </Show>
    </>
  );
}
