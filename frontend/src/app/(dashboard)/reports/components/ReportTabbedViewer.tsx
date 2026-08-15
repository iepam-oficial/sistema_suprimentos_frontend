'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Divider,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  VStack,
} from '@chakra-ui/react';
import { filterTableByKeys } from '@/features/reports/columnSelection';
import { prepareChartDataForDisplay, resolveChartType } from '@/features/reports/chartConfig';
import {
  filterRowsByTab,
  getReportTabs,
  getSummaryTable,
  type ReportTabId,
} from '@/features/reports/reportTabs';
import type { ReportDetailBlock, ReportPayload } from '@/features/reports/types';
import { ReportChart } from './ReportChart';
import { ReportChartCard } from './ReportChartCard';
import { ReportDetailTable } from './ReportDetailTable';

export interface ReportTabbedViewerProps {
  data: ReportPayload;
  /** optional: filtered headers/rows after column picker — if not provided use data.table* */
  displayHeaders?: string[];
  displayRows?: (string | number)[][];
  displayRowDetails?: (ReportDetailBlock | null)[];
  /** When set with data.columnKeys, filters visible table columns after tab filter. */
  columnSelection?: Record<string, boolean>;
  hideChrome?: boolean;
}

function tabTestId(tabId: ReportTabId): string {
  if (tabId === 'summary') return 'reports-tab-resumo';
  if (tabId === 'all') return 'reports-tab-todas';
  return `reports-tab-${String(tabId).toLowerCase()}`;
}

function EmptyTabMessage() {
  return (
    <Text fontSize="sm" color="gray.500" py={4} data-testid="reports-tab-empty">
      Nenhum registro nesta aba
    </Text>
  );
}

function applyColumnSelection(
  headers: string[],
  rows: (string | number)[][],
  columnKeys: string[] | undefined,
  columnSelection: Record<string, boolean> | undefined,
): { headers: string[]; rows: (string | number)[][] } {
  if (!columnSelection || !columnKeys?.length) {
    return { headers, rows };
  }
  return filterTableByKeys(headers, columnKeys, rows, columnSelection);
}

export function ReportTabbedViewer({
  data,
  displayHeaders,
  displayRows,
  displayRowDetails,
  columnSelection,
}: ReportTabbedViewerProps) {
  const { colorMode } = useColorMode();
  const dividerClr = colorMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const tabs = useMemo(() => getReportTabs(data), [data]);
  const [tabIndex, setTabIndex] = useState(0);

  // Prefer columnSelection (applied after tab filter). Fall back to pre-filtered display*.
  const useSelectionFilter = Boolean(columnSelection && data.columnKeys?.length);
  const headers = useSelectionFilter
    ? data.tableHeaders
    : (displayHeaders ?? data.tableHeaders);
  const rows = useSelectionFilter
    ? data.tableRows
    : (displayRows ?? data.tableRows);
  const rowDetails = useSelectionFilter
    ? data.rowDetails
    : (displayRowDetails ?? data.rowDetails);

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

  const summaryTable = useMemo(() => getSummaryTable(data), [data]);

  return (
    <VStack align="stretch" spacing={4} data-testid="reports-tabbed-viewer">
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

      <Tabs
        index={tabIndex}
        onChange={setTabIndex}
        size="sm"
        variant="line"
        colorScheme="blue"
        data-testid="reports-detail-tabs"
      >
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.id} data-testid={tabTestId(tab.id)}>
              {tab.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {tabs.map((tab) => {
            if (tab.id === 'summary') {
              const hasSummary = Boolean(summaryTable && summaryTable.rows.length > 0);
              return (
                <TabPanel key={tab.id} px={0} pt={4}>
                  {hasSummary ? (
                    <ReportDetailTable
                      headers={summaryTable!.headers}
                      rows={summaryTable!.rows}
                      defaultOpen
                    />
                  ) : (
                    <EmptyTabMessage />
                  )}
                </TabPanel>
              );
            }

            // Always tab-filter on full-width rows so tabDimensionKey indices stay valid.
            const { tableRows: panelRows, rowDetails: panelDetails } =
              filterRowsByTab({
                tabId: tab.id,
                tabDimensionKey: data.tabDimensionKey,
                columnKeys: data.columnKeys,
                tableRows: useSelectionFilter ? data.tableRows : rows,
                rowDetails: useSelectionFilter ? data.rowDetails : rowDetails,
              });

            const visible = applyColumnSelection(
              useSelectionFilter ? data.tableHeaders : headers,
              panelRows,
              data.columnKeys,
              useSelectionFilter ? columnSelection : undefined,
            );

            return (
              <TabPanel key={tab.id} px={0} pt={4}>
                {panelRows.length > 0 ? (
                  <ReportDetailTable
                    headers={visible.headers}
                    rows={visible.rows}
                    rowDetails={panelDetails}
                    defaultOpen={panelRows.length <= 15}
                  />
                ) : (
                  <EmptyTabMessage />
                )}
              </TabPanel>
            );
          })}
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
