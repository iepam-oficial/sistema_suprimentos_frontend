'use client';

import { useEffect, useState } from 'react';
import { Input, type InputProps } from '@chakra-ui/react';
import {
  formatCurrencyBR,
  parseCurrencyBR,
  sanitizeCurrencyInput,
} from '@/utils/currencyInput';

export interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  size = 'sm',
  ...rest
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => (value ? formatCurrencyBR(value) : ''));

  useEffect(() => {
    setDisplay(value ? formatCurrencyBR(value) : '');
  }, [value]);

  return (
    <Input
      value={display}
      onChange={(e) => setDisplay(sanitizeCurrencyInput(e.target.value))}
      onBlur={() => {
        const parsed = parseCurrencyBR(display);
        const formatted = display ? formatCurrencyBR(parsed) : '';
        setDisplay(formatted);
        onChange(parsed);
      }}
      placeholder={placeholder}
      inputMode="decimal"
      size={size}
      {...rest}
    />
  );
}
