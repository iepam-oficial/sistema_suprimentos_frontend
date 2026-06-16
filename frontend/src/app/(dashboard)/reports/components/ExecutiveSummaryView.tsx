'use client';

import { Box, Heading, SimpleGrid, Text, useColorMode, VStack } from '@chakra-ui/react';
import { getExecutiveChartType } from '@/features/reports/chartConfig';
import { ExecutiveSummaryPayload } from '@/features/reports/types';
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

export function ExecutiveSummaryView({ data }: ExecutiveSummaryViewProps) {
  const { colorMode } = useColorMode();
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

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="md" mb={1}>{data.title}</Heading>
        <Text fontSize="sm" color="gray.500">
          Visão consolidada de inventário, ordens de serviço, alertas e consumo no período.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
        {data.kpis.map((kpi) => (
          <Box key={kpi.label} {...cardProps(colorMode)}>
            <Text fontSize="xs" color="gray.500">{kpi.label}</Text>
            <Text fontSize="2xl" fontWeight="bold">{kpi.value}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <ReportExportActions
        title={data.title}
        tableHeaders={combinedHeaders}
        tableRows={combinedRows}
        fileBaseName="resumo-executivo"
      />

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
      </SimpleGrid>

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
              type={getExecutiveChartType('consumption-category', consumptionByCategory.length)}
              emptyMessage="Sem dados de consumo por categoria"
            />
          </ReportChartCard>
        </SimpleGrid>
      ) : (
        <Box {...cardProps(colorMode)}>
          <Text fontSize="sm" color="gray.500">
            Nenhum dado de consumo encontrado para os filtros selecionados.
          </Text>
        </Box>
      )}

      <ReportDetailTable
        headers={combinedHeaders}
        rows={combinedRows}
        defaultOpen={false}
      />
    </VStack>
  );
}
