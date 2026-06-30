'use client';

import { Select } from '@chakra-ui/react';
import type { UnitOfMeasureDTO } from '@ti-assistant/contracts';

interface UnitOfMeasureSelectProps {
  units: UnitOfMeasureDTO[];
  value: string;
  onChange: (symbol: string) => void;
  isDisabled?: boolean;
  isRequired?: boolean;
  placeholder?: string;
}

export function UnitOfMeasureSelect({
  units,
  value,
  onChange,
  isDisabled = false,
  isRequired = false,
  placeholder = 'Selecione a unidade',
}: UnitOfMeasureSelectProps) {
  return (
    <Select
      size="sm"
      value={value}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isRequired={isRequired}
      onChange={(e) => onChange(e.target.value)}
    >
      {units.map((unit) => (
        <option key={unit.id} value={unit.symbol}>
          {unit.symbol} — {unit.name}
        </option>
      ))}
    </Select>
  );
}
