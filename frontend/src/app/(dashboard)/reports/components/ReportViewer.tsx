'use client';

import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useColorMode,
  VStack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { prepareChartDataForDisplay, resolveChartType } from '@/features/reports/chartConfig';
import { ExecutiveSummaryPayload, FilterOptions, ReportPayload } from '@/features/reports/types';
import { ExecutiveSummaryView } from './ExecutiveSummaryView';
import { getActiveFilterChips, ReportFiltersState } from './ReportFilters';
import { ReportChart } from './ReportChart';
import { ReportChartCard } from './ReportChartCard';
import { ReportDetailTable } from './ReportDetailTable';
import { ReportExportActions } from './ReportExportActions';

const cardProps = (colorMode: string) => ({
  p: 4,
  rounded: 'lg',
  border: '1px solid',
  borderColor: colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  bg: colorMode === 'dark' ? 'rgba(45,55,72,0.5)' : 'rgba(255,255,255,0.5)',
});

function isExecutiveSummary(
  data: ReportPayload | ExecutiveSummaryPayload
): data is ExecutiveSummaryPayload {
  return data.slug === 'executive-summary';
}

interface ReportViewerProps {
  data: ReportPayload | ExecutiveSummaryPayload | null;
  loading: boolean;
  filters?: ReportFiltersState;
  filterOptions?: FilterOptions | null;
}

export function ReportViewer({
  data,
  loading,
  filters,
  filterOptions,
}: ReportViewerProps) {
  const { colorMode } = useColorMode();

  if (loading) {
    return <Text color="gray.500">Carregando relatório...</Text>;
  }

  if (!data) {
    return <Text color="gray.500">Selecione um relatório ou ajuste os filtros.</Text>;
  }

  if (isExecutiveSummary(data)) {
    return <ExecutiveSummaryView data={data} />;
  }

  const colorByLabel = data.slug === 'alerts-by-level';
  const dataKey =
    data.slug === 'purchases-by-batch' || data.chartValueKey === 'value'
      ? 'value'
      : 'count';

  const resolvedType = resolveChartType(data.slug, data.chartType, data.chartData);
  const { truncated } = prepareChartDataForDisplay(
    data.chartData,
    resolvedType,
    dataKey
  );

  const filterChips =
    filters && filterOptions ? getActiveFilterChips(filters, filterOptions) : [];

  return (
    <VStack align="stretch" spacing={6}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', md: 'flex-start' }}
        gap={4}
      >
        <Box flex={1}>
          <Heading size="md" mb={1}>{data.title}</Heading>
          <Text fontSize="sm" color="gray.500" mb={2}>{data.description}</Text>
          {filterChips.length > 0 && (
            <Wrap spacing={1}>
              {filterChips.map((chip) => (
                <WrapItem key={chip.key}>
                  <Tag size="sm" variant="outline" colorScheme="gray">
                    <TagLabel>{chip.label}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </Box>
        <ReportExportActions
          title={data.title}
          tableHeaders={data.tableHeaders}
          tableRows={data.tableRows}
          fileBaseName={data.slug}
        />
      </Flex>

      <SimpleGrid columns={{ base: 2, md: data.kpis.length > 2 ? 3 : 2 }} spacing={3}>
        {data.kpis.map((kpi) => (
          <Box key={kpi.label} {...cardProps(colorMode)}>
            <Text fontSize="xs" color="gray.500">{kpi.label}</Text>
            <Text fontSize="xl" fontWeight="bold">{kpi.value}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <ReportChartCard
        title="Visualização"
        subtitle="Gráfico adaptado ao tipo de dado deste relatório"
        hint={
          truncated
            ? 'O gráfico mostra os 10 principais itens; consulte a tabela para a lista completa.'
            : undefined
        }
      >
        <ReportChart
          slug={data.slug}
          data={data.chartData}
          type={data.chartType}
          colorByLabel={colorByLabel}
          dataKey={dataKey}
        />
      </ReportChartCard>

      <ReportDetailTable
        headers={data.tableHeaders}
        rows={data.tableRows}
        defaultOpen={data.tableRows.length <= 15}
      />
    </VStack>
  );
}
