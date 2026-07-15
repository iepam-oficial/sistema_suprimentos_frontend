'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useColorMode,
  VStack,
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { REPORT_CATALOG, REPORT_GROUPS } from '@/features/reports/catalog';
import { ReportSlug } from '@/features/reports/types';

const GROUP_ICONS: Record<string, string> = {
  Geral: '📊',
  Inventário: '📦',
  Suprimentos: '🧰',
  Compras: '🛒',
  'OS e Manutenção': '🔧',
  Alertas: '🔔',
};

interface ReportCatalogProps {
  activeSlug: ReportSlug;
  onSelect: (slug: ReportSlug) => void;
}

export function ReportCatalog({ activeSlug, onSelect }: ReportCatalogProps) {
  const { colorMode } = useColorMode();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REPORT_CATALOG;
    return REPORT_CATALOG.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q)
    );
  }, [query]);

  const groupsWithItems = REPORT_GROUPS.map((group) => ({
    group,
    items: filtered.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <VStack align="stretch" spacing={3} w="full">
      <InputGroup size="sm">
        <InputLeftElement pointerEvents="none">
          <Search size={14} color="gray" />
        </InputLeftElement>
        <Input
          placeholder="Buscar relatório..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
          borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
        />
      </InputGroup>

      {groupsWithItems.length === 0 ? (
        <Text fontSize="sm" color="gray.500" px={2}>
          Nenhum relatório encontrado.
        </Text>
      ) : (
        groupsWithItems.map(({ group, items }) => (
          <Box key={group}>
            <Text
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="gray.500"
              mb={1.5}
              px={1}
            >
              {GROUP_ICONS[group] ?? '•'} {group}
            </Text>
            <VStack align="stretch" spacing={1}>
              {items.map((item) => {
                const isActive = item.slug === activeSlug;
                return (
                  <Box
                    key={item.slug}
                    px={3}
                    py={2.5}
                    rounded="md"
                    borderLeft="3px solid"
                    borderLeftColor={isActive ? 'blue.400' : 'transparent'}
                    bg={
                      isActive
                        ? colorMode === 'dark'
                          ? 'blue.900'
                          : 'blue.50'
                        : 'transparent'
                    }
                    cursor="pointer"
                    onClick={() => onSelect(item.slug)}
                    _hover={{
                      bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
                    }}
                    transition="background 0.15s"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight={isActive ? 'semibold' : 'medium'}
                      lineHeight="short"
                    >
                      {item.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1} mt={0.5}>
                      {item.description}
                    </Text>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        ))
      )}
    </VStack>
  );
}
