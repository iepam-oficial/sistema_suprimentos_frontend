'use client';

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
import { useAuthSession } from '@/features/identity';
import {
  ManagerOpsAlertsPanel,
  ManagerOpsInbox,
  ManagerOpsKpiCards,
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
  const { data, loading, error, isStale } = useManagerOpsDashboard();

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

            {/* T11: kanban de compras (solicitação → aprovação → cotação → PO → fornecedor → recebimento → concluído) */}
            <SectionStub title="Kanban" note="Kanban de compras — implementado na T11" />

            {/* T11/T12: saúde do estoque (normal/atenção/crítico, lotes vencendo/vencidos, inativos) */}
            <SectionStub title="Saúde do Estoque" note="Indicadores de saúde do estoque — implementado na T11/T12" />

            {/* T12: calendário de vencimentos (lotes, prazos de requisição/cotação/PO, eventos) */}
            <SectionStub title="Calendário" note="Calendário de vencimentos — implementado na T12" />

            {/* T12: gráficos de consumo por setor, top consumidos, gastos por mês, desempenho de fornecedores */}
            <SectionStub title="Consumo e Gastos" note="Gráficos de consumo e gastos — implementado na T12" />
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
