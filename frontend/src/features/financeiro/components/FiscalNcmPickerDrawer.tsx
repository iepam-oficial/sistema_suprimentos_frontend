'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import type { FiscalNcmDTO } from '@ti-assistant/contracts';
import { fetchFiscalNcms } from '@/features/financeiro/api/fiscalCatalogApi';
import { formatNcmCestUfHint } from '@/features/financeiro/lib/cestUf';

const DEBOUNCE_MS = 300;

export interface FiscalNcmPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNcmCode: string | null;
  onSelect: (ncm: { id: string; code: string; description: string }) => void;
}

function normalizeNcmDigits(code: string): string {
  return code.replace(/\D/g, '');
}

function formatNcmDisplay(code: string): string {
  const digits = normalizeNcmDigits(code);
  if (digits.length !== 8) return code;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

function sharedDigitPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) {
    i += 1;
  }
  return i;
}

function sortNcmsByApproximation(
  items: FiscalNcmDTO[],
  invoiceNcmCode: string | null,
): FiscalNcmDTO[] {
  const refDigits = invoiceNcmCode ? normalizeNcmDigits(invoiceNcmCode) : '';

  return [...items].sort((a, b) => {
    if (refDigits) {
      const prefixA = sharedDigitPrefixLength(refDigits, normalizeNcmDigits(a.code));
      const prefixB = sharedDigitPrefixLength(refDigits, normalizeNcmDigits(b.code));
      if (prefixB !== prefixA) {
        return prefixB - prefixA;
      }
    }
    return a.code.localeCompare(b.code);
  });
}

export function FiscalNcmPickerDrawer({
  isOpen,
  onClose,
  invoiceNcmCode,
  onSelect,
}: FiscalNcmPickerDrawerProps) {
  const drawerBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const referenceBg = useColorModeValue('blue.50', 'blue.900');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<FiscalNcmDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchInput('');
      setDebouncedSearch('');
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, searchInput]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadNcms = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFiscalNcms({
          active: true,
          q: debouncedSearch || undefined,
          limit: 100,
        });
        if (!cancelled) {
          setItems(result.items);
        }
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(
            err instanceof Error ? err.message : 'Erro ao buscar códigos NCM',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNcms();

    return () => {
      cancelled = true;
    };
  }, [isOpen, debouncedSearch]);

  const sortedItems = useMemo(
    () => sortNcmsByApproximation(items, invoiceNcmCode),
    [items, invoiceNcmCode],
  );

  const handleSelect = useCallback(
    (ncm: FiscalNcmDTO) => {
      onSelect({
        id: ncm.id,
        code: ncm.code,
        description: ncm.description,
      });
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" color={headerColor}>
          Escolher NCM no catálogo
        </DrawerHeader>
        <DrawerBody p={4}>
          <VStack align="stretch" spacing={4}>
            <Box
              p={3}
              borderRadius="md"
              bg={referenceBg}
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Text fontSize="xs" fontWeight="semibold" color={mutedColor} mb={1}>
                NCM/SH da nota fiscal (referência)
              </Text>
              <Text fontSize="md" fontWeight="medium" color={headerColor}>
                {invoiceNcmCode
                  ? formatNcmDisplay(invoiceNcmCode)
                  : 'Não informado na NF'}
              </Text>
            </Box>

            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color={mutedColor} />
              </InputLeftElement>
              <Input
                value={searchInput}
                placeholder="Buscar por código ou descrição"
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </InputGroup>

            {isLoading ? (
              <Box py={6} textAlign="center">
                <Spinner size="sm" mr={2} />
                <Text as="span" fontSize="sm" color={mutedColor}>
                  Carregando catálogo...
                </Text>
              </Box>
            ) : error ? (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            ) : sortedItems.length === 0 ? (
              <Text fontSize="sm" color={mutedColor}>
                Nenhum NCM ativo encontrado.
              </Text>
            ) : (
              <VStack
                align="stretch"
                spacing={0}
                maxH="calc(100vh - 280px)"
                overflowY="auto"
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
              >
                {sortedItems.map((ncm) => {
                  const cestHint = formatNcmCestUfHint(ncm.cests);
                  return (
                    <Box
                      key={ncm.id}
                      px={3}
                      py={3}
                      cursor="pointer"
                      borderBottomWidth="1px"
                      borderColor={borderColor}
                      _last={{ borderBottomWidth: 0 }}
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleSelect(ncm)}
                    >
                      <Text fontSize="sm" fontWeight="semibold" color={headerColor}>
                        {formatNcmDisplay(ncm.code)}
                      </Text>
                      <Text fontSize="sm" color={mutedColor} noOfLines={2}>
                        {ncm.description}
                      </Text>
                      {cestHint ? (
                        <Text fontSize="xs" color={mutedColor} noOfLines={2}>
                          {cestHint}
                        </Text>
                      ) : null}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
