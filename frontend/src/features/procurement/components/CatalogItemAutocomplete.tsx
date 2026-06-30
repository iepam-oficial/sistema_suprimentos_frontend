'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Input,
  ListItem,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { CatalogSearchResultDTO } from '@ti-assistant/contracts';
import { AnchoredDropdownList } from '@/components/ui/AnchoredDropdownList';
import { useCatalogSearch } from '../hooks/useCatalogSearch';

export interface CatalogSelection {
  description: string;
  unit?: string;
  supply_id?: string;
  inventory_id?: string;
}

interface CatalogItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: CatalogSelection) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export function CatalogItemAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Descrição do item',
  isDisabled = false,
}: CatalogItemAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { results, isLoading } = useCatalogSearch(value, { enabled: !isDisabled });
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: CatalogSearchResultDTO) => {
    const selection: CatalogSelection = {
      description: item.label,
      unit: item.unit ?? undefined,
    };

    if (item.type === 'SUPPLY') {
      selection.supply_id = item.id;
    } else {
      selection.inventory_id = item.id;
    }

    onSelect(selection);
    setShowSuggestions(false);
  };

  const shouldShowList =
    showSuggestions && value.trim().length >= 2 && (isLoading || results.length > 0);

  return (
    <Box w="full">
      <Input
        ref={inputRef}
        size="sm"
        value={value}
        placeholder={placeholder}
        isDisabled={isDisabled}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
      />

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
              key={`${item.type}-${item.id}`}
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
                {item.label}
              </Text>
              {item.description && (
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {item.description}
                </Text>
              )}
              <Text fontSize="xs" color="gray.400">
                {item.type === 'SUPPLY' ? 'Suprimento' : 'Inventário'}
                {item.unit ? ` · ${item.unit}` : ''}
              </Text>
            </ListItem>
          ))
        )}
      </AnchoredDropdownList>
    </Box>
  );
}
