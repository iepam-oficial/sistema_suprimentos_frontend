'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Input,
  InputGroup,
  ListItem,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { FiscalNcmDTO } from '@ti-assistant/contracts';
import { AnchoredDropdownList } from '@/components/ui/AnchoredDropdownList';
import { useFiscalNcmSearch } from '../hooks/useFiscalNcmSearch';

export interface FiscalNcmAutocompleteProps {
  value: { id: string; code: string; description?: string } | null;
  onChange: (ncm: { id: string; code: string; description?: string } | null) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

function formatNcmDisplay(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 8) return code;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

function formatSelectionLabel(selection: {
  code: string;
  description?: string;
}): string {
  const code = formatNcmDisplay(selection.code);
  if (selection.description?.trim()) {
    return `${code} — ${selection.description.trim()}`;
  }
  return code;
}

function toSelection(item: FiscalNcmDTO): {
  id: string;
  code: string;
  description?: string;
} {
  return {
    id: item.id,
    code: item.code,
    description: item.description,
  };
}

export function FiscalNcmAutocomplete({
  value,
  onChange,
  placeholder = 'Buscar NCM por código ou descrição',
  isDisabled = false,
}: FiscalNcmAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { results, isLoading } = useFiscalNcmSearch(inputValue, {
    enabled: !isDisabled && showSuggestions,
  });
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    if (!isSearching) {
      setInputValue(value ? formatSelectionLabel(value) : '');
    }
  }, [value, isSearching]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setShowSuggestions(false);
      setIsSearching(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (next: string) => {
    setIsSearching(true);
    setInputValue(next);
    setShowSuggestions(true);

    if (value) {
      onChange(null);
    }

    if (!next.trim()) {
      onChange(null);
    }
  };

  const handleSelect = (item: FiscalNcmDTO) => {
    const selection = toSelection(item);
    onChange(selection);
    setInputValue(formatSelectionLabel(selection));
    setIsSearching(false);
    setShowSuggestions(false);
  };

  const shouldShowList =
    showSuggestions && inputValue.trim().length >= 2 && (isLoading || results.length > 0);

  return (
    <Box w="full">
      <InputGroup size="sm">
        <Input
          ref={inputRef}
          value={inputValue}
          placeholder={placeholder}
          isDisabled={isDisabled}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
      </InputGroup>

      <AnchoredDropdownList
        anchorRef={inputRef}
        listRef={listRef}
        isOpen={shouldShowList}
      >
        {isLoading ? (
          <ListItem px={3} py={2}>
            <Spinner size="sm" mr={2} />
            <Text as="span" fontSize="sm">
              Buscando...
            </Text>
          </ListItem>
        ) : (
          results.map((item) => (
            <ListItem
              key={item.id}
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              <Text fontSize="sm" fontWeight="medium">
                {formatNcmDisplay(item.code)}
              </Text>
              <Text fontSize="xs" color="gray.500" noOfLines={2}>
                {item.description}
              </Text>
            </ListItem>
          ))
        )}
      </AnchoredDropdownList>
    </Box>
  );
}
