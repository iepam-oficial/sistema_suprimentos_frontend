'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { getExecutiveChartType } from '@/features/reports/chartConfig';
import { toExcelSheetsFromExecutive } from '@/features/reports/reportExcelAdapter';
import { reportExportFileName } from '@/features/reports/reportExportFileName';
import { ExecutiveSummaryPayload } from '@/features/reports/types';
import { ReportChart } from './ReportChart';
import { ReportChartCard } from './ReportChartCard';
import { ReportDetailTable } from './ReportDetailTable';
import { ReportExportActions } from './ReportExportActions';

interface ExecutiveSummaryViewProps {
  data: ExecutiveSummaryPayload;
}

type ConsumptionDimension = {
  label: string;
  quantity: number;
};

type ExecutiveSummaryWithConsumption = ExecutiveSummaryPayload & {
  consumptionByPolo?: ConsumptionDimension[];
  consumptionByCategory?: ConsumptionDimension[];
};

const TAB_OPERACOES = 0;
const TAB_CONSUMO = 1;

function getInitialTabIndex(): number {
  if (typeof window !== 'undefined' && window.location.hash === '#consumption-trends') {
    return TAB_CONSUMO;
  }
  return TAB_OPERACOES;
}

const EXEC_SECTION_BY_TAB = {
  operations: 'operations',
  consumption: 'consumption',
  alerts: 'alerts',
} as const;

function findExecutiveSection(
  sections: ExecutiveSummaryPayload['sections'],
  id: (typeof EXEC_SECTION_BY_TAB)[keyof typeof EXEC_SECTION_BY_TAB],
) {
  return sections?.find((section) => section.id === id);
}

export function ExecutiveSummaryView({ data }: ExecutiveSummaryViewProps) {
  const [tabIndex, setTabIndex] = useState(getInitialTabIndex);
  const summaryWithConsumption = data as ExecutiveSummaryWithConsumption;

  const osData = data.serviceOrdersByMonth.map((m) => ({
    label: m.month,
    count: m.count,
  }));
  const invData = data.inventoryByType.map((t) => ({
    label: t.type,
    count: t.count,
  }));
  const alertData = data.alertsByLevel.map((a) => ({
    label: a.level,
    count: a.count,
  }));
  const consumptionByPolo = (summaryWithConsumption.consumptionByPolo ?? []).map((item) => ({
    label: item.label,
    count: (item as { quantity?: number; count?: number }).quantity ?? item.count ?? 0,
  }));
  const consumptionByCategory = (summaryWithConsumption.consumptionByCategory ?? []).map(
    (item) => ({
      label: item.label,
      count: (item as { quantity?: number; count?: number }).quantity ?? item.count ?? 0,
    })
  );
  const hasConsumptionData =
    consumptionByPolo.length > 0 || consumptionByCategory.length > 0;

  const operationsSection = findExecutiveSection(data.sections, EXEC_SECTION_BY_TAB.operations);
  const consumptionSection = findExecutiveSection(data.sections, EXEC_SECTION_BY_TAB.consumption);
  const alertsSection = findExecutiveSection(data.sections, EXEC_SECTION_BY_TAB.alerts);

  const combinedHeaders = ['Indicador', 'Valor'];
  const combinedRows = [
    ...data.kpis.map((k) => [k.label, String(k.value)]),
    ...data.serviceOrdersByMonth.map((m) => [`OS - ${m.month}`, String(m.count)]),
    ...data.inventoryByType.map((t) => [`Inventário - ${t.type}`, String(t.count)]),
    ...data.alertsByLevel.map((a) => [`Alerta - ${a.level}`, String(a.count)]),
    ...consumptionByPolo.map((item) => [`Consumo por polo - ${item.label}`, String(item.count)]),
    ...consumptionByCategory.map((item) => [
      `Consumo por categoria - ${item.label}`,
      String(item.count),
    ]),
  ];
  const sheets = toExcelSheetsFromExecutive(data);

  return (
    <VStack align="stretch" spacing={6} data-testid="reports-content">
      <Box>
        <Heading size="md" mb={1}>{data.title}</Heading>
        <Text fontSize="sm" color="gray.500">
          Visão consolidada de inventário, ordens de serviço, alertas e consumo no período.
        </Text>
      </Box>

      <Box data-testid="reports-export">
        <ReportExportActions
          excelFileName={reportExportFileName('executive-summary', 'xlsx')}
          sheets={sheets}
          pdfTitle={data.title}
          pdfHeaders={combinedHeaders}
          pdfRows={combinedRows}
          pdfFileName={reportExportFileName('executive-summary', 'pdf')}
        />
      </Box>

      <Tabs
        index={tabIndex}
        onChange={setTabIndex}
        size="sm"
        variant="line"
        colorScheme="blue"
        data-testid="reports-exec-tabs"
      >
        <TabList>
          <Tab data-testid="reports-exec-tab-operacoes">Operações</Tab>
          <Tab data-testid="reports-exec-tab-consumo">Consumo</Tab>
          <Tab data-testid="reports-exec-tab-alertas">Alertas</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={4}>
            <VStack align="stretch" spacing={6}>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                {data.kpis.map((kpi) => (
                  <Box key={kpi.label} py={2}>
                    <Text fontSize="xs" color="gray.500">{kpi.label}</Text>
                    <Text fontSize="2xl" fontWeight="bold">{kpi.value}</Text>
                  </Box>
                ))}
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                <ReportChartCard
                  title="Ordens de serviço por mês"
                  subtitle="Evolução no período selecionado"
                >
                  <ReportChart
                    data={osData}
                    type={getExecutiveChartType('service-orders', osData.length)}
                    emptyMessage="Nenhuma OS no período"
                  />
                </ReportChartCard>

                <ReportChartCard
                  title="Inventário por tipo"
                  subtitle="Composição do patrimônio"
                >
                  <ReportChart
                    data={invData}
                    type={getExecutiveChartType('inventory', invData.length)}
                    emptyMessage="Nenhum item"
                  />
                </ReportChartCard>
              </SimpleGrid>

              {operationsSection ? (
                <ReportDetailTable
                  headers={operationsSection.tableHeaders}
                  rows={operationsSection.tableRows}
                  rowDetails={operationsSection.rowDetails}
                />
              ) : (
                <ReportDetailTable
                  headers={combinedHeaders}
                  rows={combinedRows}
                  defaultOpen={false}
                />
              )}
            </VStack>
          </TabPanel>

          <TabPanel px={0} pt={4}>
            <VStack align="stretch" spacing={6}>
              <Box id="consumption-trends">
                <Heading size="sm" mb={1}>Tendências de consumo</Heading>
                <Text fontSize="sm" color="gray.500">
                  Distribuição do consumo por polo e por categoria.
                </Text>
              </Box>

              {hasConsumptionData ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  <ReportChartCard
                    title="Consumo por polo"
                    subtitle="Itens consumidos por unidade/polo"
                  >
                    <ReportChart
                      data={consumptionByPolo}
                      type={getExecutiveChartType('consumption-polo', consumptionByPolo.length)}
                      emptyMessage="Sem dados de consumo por polo"
                    />
                  </ReportChartCard>

                  <ReportChartCard
                    title="Consumo por categoria"
                    subtitle="Itens consumidos por categoria"
                  >
                    <ReportChart
                      data={consumptionByCategory}
                      type={getExecutiveChartType(
                        'consumption-category',
                        consumptionByCategory.length
                      )}
                      emptyMessage="Sem dados de consumo por categoria"
                    />
                  </ReportChartCard>
                </SimpleGrid>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  Nenhum dado de consumo encontrado para os filtros selecionados.
                </Text>
              )}

              {consumptionSection ? (
                <ReportDetailTable
                  headers={consumptionSection.tableHeaders}
                  rows={consumptionSection.tableRows}
                  rowDetails={consumptionSection.rowDetails}
                />
              ) : null}
            </VStack>
          </TabPanel>

          <TabPanel px={0} pt={4}>
            <VStack align="stretch" spacing={6}>
              <ReportChartCard
                title="Alertas por nível"
                subtitle="Distribuição por gravidade"
              >
                <ReportChart
                  data={alertData}
                  type={getExecutiveChartType('alerts', alertData.length)}
                  colorByLabel
                  emptyMessage="Nenhum alerta"
                />
              </ReportChartCard>

              {alertsSection ? (
                <ReportDetailTable
                  headers={alertsSection.tableHeaders}
                  rows={alertsSection.tableRows}
                  rowDetails={alertsSection.rowDetails}
                />
              ) : null}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
