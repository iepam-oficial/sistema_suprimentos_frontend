'use client';

import { HStack, Tag, TagCloseButton, TagLabel, Text, useColorModeValue } from '@chakra-ui/react';
import type { DrilldownChip, DrilldownDimension } from '../hooks/useExecutiveDrilldown';

interface DrilldownBreadcrumbProps {
  chips: DrilldownChip[];
  onClear: (dimension: DrilldownDimension) => void;
  onClearAll: () => void;
}

/** Chips for the inline drill-down levels (polo / setor / categoria) — EFD-23. */
export function DrilldownBreadcrumb({ chips, onClear, onClearAll }: DrilldownBreadcrumbProps) {
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  if (chips.length === 0) return null;

  return (
    <HStack spacing={2} wrap="wrap">
      <Text fontSize="xs" color={labelColor} fontWeight="semibold">
        Drill-down:
      </Text>
      {chips.map((chip) => (
        <Tag key={chip.dimension} size="sm" colorScheme="blue" borderRadius="full">
          <TagLabel>{chip.label}</TagLabel>
          <TagCloseButton
            onClick={() => onClear(chip.dimension)}
            aria-label={`Limpar filtro ${chip.label}`}
          />
        </Tag>
      ))}
      {chips.length > 1 && (
        <Tag
          size="sm"
          variant="outline"
          colorScheme="gray"
          borderRadius="full"
          cursor="pointer"
          onClick={onClearAll}
        >
          <TagLabel>Limpar tudo</TagLabel>
        </Tag>
      )}
    </HStack>
  );
}
