'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Input,
  List,
  ListItem,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ChartOfAccount } from '@/features/financeiro/types';

interface ChartOfAccountComboboxProps {
  accounts: ChartOfAccount[];
  value: string;
  onChange: (accountId: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export function ChartOfAccountCombobox({
  accounts,
  value,
  onChange,
  isDisabled = false,
  placeholder = 'Buscar plano de contas',
}: ChartOfAccountComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const listBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const selected = accounts.find((account) => account.id === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return accounts.slice(0, 30);
    return accounts
      .filter(
        (account) =>
          account.codigo.toLowerCase().includes(term) ||
          account.nome.toLowerCase().includes(term),
      )
      .slice(0, 30);
  }, [accounts, query]);

  const displayValue = open
    ? query
    : selected
      ? `${selected.codigo} — ${selected.nome}`
      : '';

  return (
    <Box position="relative" w="full">
      <Input
        value={displayValue}
        placeholder={placeholder}
        isDisabled={isDisabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery(selected ? `${selected.codigo} ${selected.nome}` : '');
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={10}
          mt={1}
          maxH="220px"
          overflowY="auto"
          bg={listBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="md"
        >
          {filtered.map((account) => (
            <ListItem
              key={account.id}
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(account.id);
                setQuery('');
                setOpen(false);
              }}
            >
              <Text fontSize="sm" fontWeight="medium">
                {account.codigo} — {account.nome}
              </Text>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
