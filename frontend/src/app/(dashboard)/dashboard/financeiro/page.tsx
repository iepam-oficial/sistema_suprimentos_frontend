'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ExecutiveFinanceFilters as ExecutiveFinanceFiltersState } from '@ti-assistant/contracts';
import { PoloMetric } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import {
  DrilldownBreadcrumb,
  ExecutiveFinanceAlertsPanel,
  ExecutiveFinanceFilters,
  ExecutiveKpiCards,
  ExpensesByCategoryChart,
  FinancialEvolutionChart,
  NamedValueBarChart,
  PatrimonyByCategoryChart,
  PoloComparisonChart,
  PoloRankingTable,
  SavingsBreakdownChart,
  SavingsEvolutionChart,
  TopSuppliersTable,
  getDefaultExecutiveFinanceFilters,
  useExecutiveDrilldown,
  useExecutiveFinanceDashboard,
} from '@/features/executive-finance';
import { canAccessDashboard } from '@/utils/dashboardNav';

export default function ExecutiveFinanceDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [filters, setFilters] = useState<ExecutiveFinanceFiltersState>(
    getDefaultExecutiveFinanceFilters
  );

  const canAccess = Boolean(user?.role && canAccessDashboard(user.role));

  useEffect(() => {
    if (authLoading) return;
    if (!user || !canAccess) {
      router.replace('/unauthorized');
    }
  }, [authLoading, user, canAccess, router]);

  const { data, loading, error, isStale } = useExecutiveFinanceDashboard(filters);
  const drilldown = useExecutiveDrilldown(filters, setFilters);
  const alerts = data?.alerts ?? [];
  const hasAlerts = alerts.length > 0;

  const bg = useColorModeValue('gray.50', 'gray.900');

  if (authLoading || !user || !canAccess) {
    return (
      <Center minH="60vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <VStack
      spacing={3}
      align="stretch"
      bg={bg}
      minH="0"
      py={{ base: 2, md: 3 }}
      px={{ base: 3, md: 4, lg: 5 }}
    >
      {(isStale || error) && (
        <Alert status="warning" borderRadius="md" py={2}>
          <AlertIcon />
          <Text fontSize="sm">
            {error ?? 'Dados desatualizados: a última atualização automática falhou. Exibindo o último resultado válido.'}
          </Text>
        </Alert>
      )}

      <ExecutiveFinanceFilters filters={filters} onChange={setFilters} />

      <DrilldownBreadcrumb
        chips={drilldown.chips}
        onClear={drilldown.clearDimension}
        onClearAll={drilldown.clearAll}
      />

      <ExecutiveKpiCards kpis={data?.kpis ?? null} loading={loading} />

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
        <FinancialEvolutionChart data={data?.financialEvolution} loading={loading} />
        <PoloComparisonChart
          data={data?.poloComparison}
          metric={filters.poloMetric ?? PoloMetric.DESPESAS}
          onMetricChange={(poloMetric) => setFilters((prev) => ({ ...prev, poloMetric }))}
          loading={loading}
          onItemClick={(item) => drilldown.handlePoloClick(item.id, item.label)}
        />
      </SimpleGrid>

      <Flex gap={3} align="flex-start" direction={{ base: 'column', xl: 'row' }}>
        <Box flex="1" minW="0">
          <VStack spacing={3} align="stretch">
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <NamedValueBarChart
                title="Compras por Setor"
                data={data?.purchasesBySector}
                loading={loading}
                valueLabel="Compras"
                emptyLabel="Sem compras por setor no período selecionado"
                onItemClick={(item) => drilldown.handleSectorClick(item.id, item.label)}
              />
              <ExpensesByCategoryChart
                data={data?.expensesByCategory}
                loading={loading}
                onItemClick={(item) => drilldown.handleCategoryClick(item.id, item.label)}
              />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <SavingsBreakdownChart data={data?.savingsBreakdown} loading={loading} />
              <SavingsEvolutionChart data={data?.savingsEvolution} loading={loading} />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <NamedValueBarChart
                title="Patrimônio por Polo"
                data={data?.patrimonyByPolo}
                loading={loading}
                valueLabel="Patrimônio"
                emptyLabel="Sem patrimônio por polo no período selecionado"
              />
              <PatrimonyByCategoryChart data={data?.patrimonyByCategory} loading={loading} />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <NamedValueBarChart
                title="Estoque Financeiro"
                data={data?.stockFinancial}
                loading={loading}
                valueLabel="Estoque"
                emptyLabel="Sem dados de estoque financeiro no período selecionado"
              />
              <TopSuppliersTable data={data?.topSuppliers} loading={loading} />
            </SimpleGrid>

            <PoloRankingTable
              data={data?.poloRanking}
              loading={loading}
              onRowClick={(row) => drilldown.handlePoloClick(row.locationId, row.polo)}
            />
          </VStack>
        </Box>

        {hasAlerts && (
          <Box w={{ base: 'full', xl: '300px' }} flexShrink={0}>
            <ExecutiveFinanceAlertsPanel alerts={alerts} />
          </Box>
        )}
      </Flex>
    </VStack>
  );
}
