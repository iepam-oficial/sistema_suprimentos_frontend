'use client';

import { useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  Heading,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ManagerOpsConsumptionPeriod } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import {
  ManagerOpsAlertsPanel,
  ManagerOpsCalendar,
  ManagerOpsConsumptionChart,
  ManagerOpsInbox,
  ManagerOpsKanban,
  ManagerOpsKpiCards,
  ManagerOpsSpendChart,
  ManagerOpsStockHealth,
  ManagerOpsSuppliersTable,
  ManagerOpsTopConsumed,
  useManagerOpsDashboard,
} from '@/features/manager-ops';

/** Stub for a section wired by a later task (kanban/stock-health/calendar/charts). */
function SectionStub({ title, note }: { title: string; note: string }) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const titleColor = useColorModeValue('gray.800', 'white');

  return (
    <Box>
      <Heading size="sm" mb={2} color={titleColor} fontWeight="semibold">
        {title}
      </Heading>
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={borderColor}
        borderRadius="md"
        bg={cardBg}
        minH="140px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="sm" color={labelColor}>
          {note}
        </Text>
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  const { loading: authLoading } = useAuthSession();
  const [consumptionPeriod, setConsumptionPeriod] = useState<ManagerOpsConsumptionPeriod>(
    ManagerOpsConsumptionPeriod.MONTH
  );
  const { data, loading, error, isStale } = useManagerOpsDashboard({ consumptionPeriod });

  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.500', 'gray.400');
  const bg = useColorModeValue('gray.50', 'gray.900');

  const alerts = data?.alerts ?? [];
  const hasAlerts = alerts.length > 0;

  if (authLoading || (loading && !data)) {
    return (
      <Center minH="60vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text color={textSecondary} fontSize="sm">
            Carregando dashboard...
          </Text>
        </VStack>
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
      <Box>
        <Heading size="md" color={textColor} fontWeight="bold" letterSpacing="tight">
          Dashboard
        </Heading>
        <Text color={textSecondary} fontSize="sm">
          Visão operacional do sistema de suprimentos
        </Text>
      </Box>

      {(isStale || error) && (
        <Alert status="warning" borderRadius="md" py={2}>
          <AlertIcon />
          <Text fontSize="sm">
            {error ?? 'Dados desatualizados: a última atualização automática falhou. Exibindo o último resultado válido.'}
          </Text>
        </Alert>
      )}

      {!data && !loading && !error && (
        <Alert status="info" borderRadius="md" py={2}>
          <AlertIcon />
          <Text fontSize="sm">Nenhum dado disponível para exibir no momento.</Text>
        </Alert>
      )}

      <ManagerOpsKpiCards kpis={data?.kpis ?? null} loading={loading} />

      <Flex gap={3} align="flex-start" direction={{ base: 'column', xl: 'row' }}>
        <Box flex="1" minW="0">
          <VStack spacing={3} align="stretch">
            <ManagerOpsInbox items={data?.inbox ?? []} loading={loading} />

            <ManagerOpsKanban columns={data?.kanban ?? []} loading={loading} />

            <ManagerOpsStockHealth stockHealth={data?.stockHealth ?? null} loading={loading} />

            <ManagerOpsCalendar events={data?.calendar ?? []} loading={loading} />

            <Flex gap={3} align="stretch" direction={{ base: 'column', lg: 'row' }}>
              <Box flex="1" minW="0">
                <ManagerOpsConsumptionChart
                  data={data?.consumptionBySector}
                  loading={loading}
                  period={consumptionPeriod}
                  onPeriodChange={setConsumptionPeriod}
                />
              </Box>
              <Box flex="1" minW="0">
                <ManagerOpsTopConsumed data={data?.topConsumed} loading={loading} />
              </Box>
            </Flex>

            <ManagerOpsSpendChart data={data?.spendByMonth} loading={loading} />

            <ManagerOpsSuppliersTable data={data?.supplierPerformance} loading={loading} />
          </VStack>
        </Box>

        {hasAlerts && (
          <Box w={{ base: 'full', xl: '300px' }} flexShrink={0}>
            <ManagerOpsAlertsPanel alerts={alerts} />
          </Box>
        )}
      </Flex>
    </VStack>
  );
}
