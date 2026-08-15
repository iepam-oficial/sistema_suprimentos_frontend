'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Columns } from 'lucide-react';
import {
  canExport,
  loadColumnSelection,
  saveColumnSelection,
} from '@/features/reports/columnSelection';

export interface ReportColumnPickerProps {
  summaryKeys: string[];
  summaryHeaders: string[];
  detailKeys?: string[];
  detailHeaders?: string[];
  selection: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}

type ColumnSelectionPayload = {
  slug?: string;
  columnKeys?: string[];
  detailColumnKeys?: string[];
} | null | undefined;

function toggleKey(
  selection: Record<string, boolean>,
  key: string,
  checked: boolean,
): Record<string, boolean> {
  return { ...selection, [key]: checked };
}

export function useReportColumnSelection(payload: ColumnSelectionPayload) {
  const slug = payload?.slug ?? '';
  const orderedKeys = useMemo(
    () => [...(payload?.columnKeys ?? []), ...(payload?.detailColumnKeys ?? [])],
    [payload?.columnKeys, payload?.detailColumnKeys],
  );

  const keysSignature = orderedKeys.join('\0');

  const [selection, setSelectionState] = useState<Record<string, boolean>>(() =>
    loadColumnSelection(slug, orderedKeys),
  );

  useEffect(() => {
    setSelectionState(loadColumnSelection(slug, orderedKeys));
    // keysSignature tracks orderedKeys content across reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when slug/key set changes
  }, [slug, keysSignature]);

  const setSelection = useCallback(
    (next: Record<string, boolean>) => {
      setSelectionState(next);
      if (slug && orderedKeys.length > 0) {
        saveColumnSelection(slug, next);
      }
    },
    [slug, orderedKeys.length],
  );

  return {
    selection,
    setSelection,
    canExport: canExport(selection),
  };
}

export function ReportColumnPicker({
  summaryKeys,
  summaryHeaders,
  detailKeys,
  detailHeaders,
  selection,
  onChange,
}: ReportColumnPickerProps) {
  const hasDetail =
    Array.isArray(detailKeys) &&
    detailKeys.length > 0 &&
    Array.isArray(detailHeaders);
  const noneSelected = !canExport(selection);

  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        leftIcon={<Columns size={16} />}
        data-testid="reports-column-picker"
      >
        Colunas
      </MenuButton>
      <MenuList maxH="320px" overflowY="auto" minW="240px" py={2} px={1}>
        <VStack align="stretch" spacing={1} px={2}>
          {summaryKeys.map((key, index) => (
            <Checkbox
              key={key}
              size="sm"
              isChecked={Boolean(selection[key])}
              onChange={(e) => onChange(toggleKey(selection, key, e.target.checked))}
            >
              {summaryHeaders[index] ?? key}
            </Checkbox>
          ))}
        </VStack>

        {hasDetail && (
          <>
            <MenuDivider />
            <Box px={3} pb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                Lotes
              </Text>
            </Box>
            <VStack align="stretch" spacing={1} px={2}>
              {detailKeys!.map((key, index) => (
                <Checkbox
                  key={key}
                  size="sm"
                  isChecked={Boolean(selection[key])}
                  onChange={(e) =>
                    onChange(toggleKey(selection, key, e.target.checked))
                  }
                >
                  {detailHeaders![index] ?? key}
                </Checkbox>
              ))}
            </VStack>
          </>
        )}

        {noneSelected && (
          <Box px={3} pt={2}>
            <Text fontSize="xs" color="orange.500">
              Selecione ao menos uma coluna para exportar.
            </Text>
          </Box>
        )}
      </MenuList>
    </Menu>
  );
}
