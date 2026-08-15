'use client';

import { useMemo } from 'react';
import {
  Box,
  Divider,
  Flex,
  Heading,
  Text,
  useColorMode,
  VStack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { isStockReportSlug } from '@/features/reports/api/reportApi';
import { prepareChartDataForDisplay, resolveChartType } from '@/features/reports/chartConfig';
import { buildStockExportTable } from '@/features/reports/columnSelection';
import { reportExportFileName } from '@/features/reports/reportExportFileName';
import {
  toExcelSheetsFromReportPayload,
  toExcelSheetsFromTabbedReport,
} from '@/features/reports/reportExcelAdapter';
import { buildPdfExportTable } from '@/features/reports/reportPdfColumns';
import {
  ExecutiveSummaryPayload,
  FilterOptions,
  ReportPayload,
  ReportSlug,
} from '@/features/reports/types';
import { ExecutiveSummaryView } from './ExecutiveSummaryView';
import { getActiveFilterChips, ReportFiltersState } from './ReportFilters';
import { ReportChart } from './ReportChart';
import { ReportChartCard } from './ReportChartCard';
import { ReportDetailTable } from './ReportDetailTable';
import { ReportExportActions } from './ReportExportActions';
import { ReportTabbedViewer } from './ReportTabbedViewer';
import { useReportColumnSelection } from './ReportColumnPicker';

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
  /** When true, omit title + export (toolbar owns them). Keeps description/chips. */
  hideChrome?: boolean;
}

export function ReportViewer({
  data,
  loading,
  filters,
  filterOptions,
  hideChrome = false,
}: ReportViewerProps) {
  const { colorMode } = useColorMode();
  const dividerClr = colorMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const stockColumnPayload =
    data &&
    !isExecutiveSummary(data) &&
    isStockReportSlug(data.slug as ReportSlug) &&
    data.columnKeys &&
    data.columnKeys.length > 0
      ? {
          slug: data.slug,
          columnKeys: data.columnKeys,
          detailColumnKeys: data.detailColumnKeys,
        }
      : null;

  const {
    selection: columnSelection,
    canExport: columnCanExport,
  } = useReportColumnSelection(stockColumnPayload);

  const excelTable = useMemo(() => {
    if (!data || isExecutiveSummary(data)) {
      return { headers: [] as string[], rows: [] as (string | number)[][] };
    }
    if (stockColumnPayload) {
      return buildStockExportTable(data, columnSelection);
    }
    return {
      headers: data.tableHeaders,
      rows: data.tableRows,
    };
  }, [data, stockColumnPayload, columnSelection]);

  const excelSheets = useMemo(() => {
    if (!data || isExecutiveSummary(data)) return [];
    if (data.tabDimensionKey || data.summaryHeaders) {
      return toExcelSheetsFromTabbedReport(data, excelTable, {
        columnSelection: stockColumnPayload ? columnSelection : undefined,
      });
    }
    return toExcelSheetsFromReportPayload(data, excelTable);
  }, [data, excelTable, stockColumnPayload, columnSelection]);

  const pdfTable = useMemo(() => {
    if (!data || isExecutiveSummary(data)) {
      return { headers: [] as string[], rows: [] as (string | number)[][] };
    }
    return buildPdfExportTable(data);
  }, [data]);

  if (loading) {
    return <Text color="gray.500">Carregando relatório...</Text>;
  }

  if (!data) {
    return <Text color="gray.500">Selecione um relatório ou ajuste os filtros.</Text>;
  }

  if (isExecutiveSummary(data)) {
    return <ExecutiveSummaryView data={data} />;
  }

  const isTabbedReport = Boolean(data.tabDimensionKey || data.summaryHeaders);

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
    filters && filterOptions
      ? getActiveFilterChips(filters, filterOptions, {
          slug: data.slug as ReportSlug,
        })
      : [];

  return (
    <VStack align="stretch" spacing={4} data-testid="reports-content">
      {!hideChrome ? (
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'flex-start' }}
          gap={4}
          pb={3}
          borderBottom="1px solid"
          borderColor={dividerClr}
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
            excelFileName={reportExportFileName(data.slug, 'xlsx')}
            sheets={excelSheets}
            pdfTitle={data.title}
            pdfHeaders={pdfTable.headers}
            pdfRows={pdfTable.rows}
            pdfFileName={reportExportFileName(data.slug, 'pdf')}
            disabled={Boolean(stockColumnPayload) && !columnCanExport}
          />
        </Flex>
      ) : (
        (data.description || filterChips.length > 0) && (
          <Box pb={2} borderBottom="1px solid" borderColor={dividerClr}>
            {data.description && (
              <Text fontSize="sm" color="gray.500" mb={filterChips.length > 0 ? 2 : 0}>
                {data.description}
              </Text>
            )}
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
        )
      )}

      {isTabbedReport ? (
        <ReportTabbedViewer data={data} hideChrome={hideChrome} />
      ) : (
        <>
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            gap={{ base: 4, lg: 6 }}
            align="stretch"
          >
            <VStack
              align="stretch"
              spacing={0}
              flex={{ lg: '0 0 220px' }}
              minW={{ lg: '180px' }}
              maxW={{ lg: '280px' }}
              divider={<Divider borderColor={dividerClr} />}
              data-testid="reports-kpis"
            >
              {data.kpis.map((kpi) => (
                <Box key={kpi.label} py={2}>
                  <Text fontSize="xs" color="gray.500">{kpi.label}</Text>
                  <Text fontSize="xl" fontWeight="bold">{kpi.value}</Text>
                </Box>
              ))}
            </VStack>

            <Box flex={1} minW={0} data-testid="reports-chart">
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
            </Box>
          </Flex>

          <ReportDetailTable
            headers={data.tableHeaders}
            rows={data.tableRows}
            rowDetails={data.rowDetails}
            defaultOpen={data.tableRows.length <= 15}
          />
        </>
      )}
    </VStack>
  );
}
