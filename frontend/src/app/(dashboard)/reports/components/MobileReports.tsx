'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Select,
  SimpleGrid,
  Text,
  useColorMode,
  VStack,
} from '@chakra-ui/react';
import { REPORT_CATALOG } from '@/lib/reports/catalog';
import { ExecutiveSummaryPayload, FilterOptions, ReportPayload, ReportSlug } from '@/lib/reports/types';
import { ReportFiltersBar, ReportFiltersState } from './ReportFilters';
import { ReportViewer } from './ReportViewer';

interface MobileReportsProps {
  activeSlug: ReportSlug;
  onSlugChange: (slug: ReportSlug) => void;
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
  filterOptions: FilterOptions | null;
  reportData: ReportPayload | ExecutiveSummaryPayload | null;
  loading: boolean;
}

export function MobileReports({
  activeSlug,
  onSlugChange,
  filters,
  onFiltersChange,
  filterOptions,
  reportData,
  loading,
}: MobileReportsProps) {
  const { colorMode } = useColorMode();

  return (
    <Container maxW="container.xl" py={4}>
      <VStack align="stretch" spacing={4} mt="4vh">
        <Flex justify="space-between" align="center">
          <Heading size="md">Relatórios</Heading>
        </Flex>

        <Select
          size="sm"
          value={activeSlug}
          onChange={(e) => onSlugChange(e.target.value as ReportSlug)}
          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
        >
          {REPORT_CATALOG.map((r) => (
            <option key={r.slug} value={r.slug}>{r.title}</option>
          ))}
        </Select>

        <ReportFiltersBar
          filters={filters}
          filterOptions={filterOptions}
          onChange={onFiltersChange}
        />

        <Box
          p={3}
          rounded="lg"
          border="1px solid"
          borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
        >
          <ReportViewer
            data={reportData}
            loading={loading}
            filters={filters}
            filterOptions={filterOptions}
          />
        </Box>
      </VStack>
    </Container>
  );
}
