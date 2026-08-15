'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type {
  AbcClassificationConfigDTO,
  AbcClassificationRunStatus,
} from '@ti-assistant/contracts';
import {
  fetchAbcClassificationConfig,
  recalculateAbcClassification,
  updateAbcClassificationConfig,
} from '@/features/catalog/api/abcClassificationApi';
import { AbcCutoffPreview } from './AbcCutoffPreview';

const ALLOWED_ROLES = ['ADMIN', 'MANAGER'] as const;

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

function runStatusBadge(status: AbcClassificationRunStatus | null): {
  label: string;
  colorScheme: string;
} {
  switch (status) {
    case 'SUCCESS':
      return { label: 'Sucesso', colorScheme: 'green' };
    case 'FAILED':
      return { label: 'Falhou', colorScheme: 'red' };
    case 'RUNNING':
      return { label: 'Em execução', colorScheme: 'orange' };
    default:
      return { label: 'Nunca executado', colorScheme: 'gray' };
  }
}

export default function AbcClassificationSettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const actionsBg = useColorModeValue('white', 'gray.800');
  const actionsBorder = useColorModeValue('gray.200', 'gray.700');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [cutoffA, setCutoffA] = useState(80);
  const [cutoffB, setCutoffB] = useState(95);
  const [analysisPeriodMonths, setAnalysisPeriodMonths] = useState(12);
  const [attentionFactorA, setAttentionFactorA] = useState(1.5);
  const [attentionFactorB, setAttentionFactorB] = useState(1.2);
  const [attentionEnabledC, setAttentionEnabledC] = useState(false);
  const [active, setActive] = useState(true);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [lastClassifiedAt, setLastClassifiedAt] = useState<string | null>(null);
  const [lastRunStatus, setLastRunStatus] = useState<AbcClassificationRunStatus | null>(null);

  const applyConfig = useCallback((data: AbcClassificationConfigDTO) => {
    setCutoffA(data.cutoff_a);
    setCutoffB(data.cutoff_b);
    setAnalysisPeriodMonths(data.analysis_period_months);
    setAttentionFactorA(data.attention_factor_a);
    setAttentionFactorB(data.attention_factor_b);
    setAttentionEnabledC(data.attention_enabled_c);
    setActive(data.active);
    setLastRunAt(data.last_run_at);
    setLastClassifiedAt(data.last_classified_at);
    setLastRunStatus(data.last_run_status);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAbcClassificationConfig();
      applyConfig(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar configuração ABC',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [applyConfig, toast]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');

    if (!token) {
      router.push('/');
      return;
    }

    if (!ALLOWED_ROLES.includes(user.role as (typeof ALLOWED_ROLES)[number])) {
      toast({
        title: 'Acesso negado',
        description: 'Somente administradores e gerentes podem gerenciar a classificação ABC.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);
    void load();
  }, [load, router, toast]);

  const handleSave = async () => {
    if (!(cutoffA > 0 && cutoffA < cutoffB && cutoffB <= 100)) {
      toast({
        title: 'Cortes inválidos',
        description: 'Informe valores com 0 < corte A < corte B ≤ 100.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (!Number.isFinite(analysisPeriodMonths) || analysisPeriodMonths < 1) {
      toast({
        title: 'Período inválido',
        description: 'O período de análise deve ser de pelo menos 1 mês.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (
      !Number.isFinite(attentionFactorA) ||
      attentionFactorA <= 0 ||
      !Number.isFinite(attentionFactorB) ||
      attentionFactorB <= 0
    ) {
      toast({
        title: 'Fatores de atenção inválidos',
        description: 'Os fatores de atenção devem ser números maiores que zero.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      const data = await updateAbcClassificationConfig({
        cutoff_a: cutoffA,
        cutoff_b: cutoffB,
        analysis_period_months: analysisPeriodMonths,
        attention_factor_a: attentionFactorA,
        attention_factor_b: attentionFactorB,
        attention_enabled_c: attentionEnabledC,
        active,
      });
      applyConfig(data);
      toast({
        title: 'Configurações salvas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateAbcClassification();
      setLastRunStatus('RUNNING');
      toast({
        title: 'Recálculo aceito',
        description: 'A classificação ABC foi enfileirada e será processada em segundo plano.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      window.setTimeout(() => {
        void load();
      }, 2000);
    } catch (err) {
      toast({
        title: 'Erro ao recalcular',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (!authorized) {
    return null;
  }

  const statusBadge = runStatusBadge(lastRunStatus);

  return (
    <Box pb={24} maxW="900px">
      <Heading size="lg" mb={2}>
        Classificação ABC
      </Heading>
      <Text mb={6} fontSize="sm" color={muted}>
        Configure os cortes Pareto, o período de análise e os fatores de atenção por classe. O
        recálculo roda de forma assíncrona e não bloqueia a interface.
      </Text>

      {loading ? (
        <VStack align="stretch" spacing={4}>
          <Skeleton height="120px" borderRadius="md" />
          <Skeleton height="100px" borderRadius="md" />
          <Skeleton height="200px" borderRadius="md" />
          <Skeleton height="200px" borderRadius="md" />
        </VStack>
      ) : (
        <VStack align="stretch" spacing={5}>
          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
            <CardHeader pb={2}>
              <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <Heading size="sm">Status do job</Heading>
                <Badge colorScheme={statusBadge.colorScheme} px={2} py={0.5}>
                  {statusBadge.label}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" color={muted} mb={1}>
                    Última execução
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDateTime(lastRunAt)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color={muted} mb={1}>
                    Última classificação com sucesso
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDateTime(lastClassifiedAt)}
                  </Text>
                </Box>
              </SimpleGrid>
              <FormControl mt={4}>
                <HStack>
                  <FormLabel mb={0} fontSize="sm" mr={3}>
                    Classificação ativa
                  </FormLabel>
                  <Switch isChecked={active} onChange={(e) => setActive(e.target.checked)} />
                </HStack>
                <FormHelperText>
                  Se desligada, o job agendado e o recálculo manual não alteram as classes do
                  catálogo.
                </FormHelperText>
              </FormControl>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
            <CardBody>
              <AbcCutoffPreview cutoffA={cutoffA} cutoffB={cutoffB} />
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
            <CardHeader pb={2}>
              <Heading size="sm">Cortes e período</Heading>
              <Text fontSize="xs" color={muted} mt={1}>
                Definem a curva ABC sobre o valor de consumo (`SAIDA × unit_cost`) no período.
              </Text>
            </CardHeader>
            <CardBody pt={2}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm">Corte A (%)</FormLabel>
                  <NumberInput
                    min={0.01}
                    max={99.99}
                    precision={2}
                    step={0.5}
                    value={cutoffA}
                    onChange={(_, value) => setCutoffA(Number.isFinite(value) ? value : 80)}
                    size="sm"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormHelperText>
                    Itens até este percentual acumulado entram na Classe A (padrão 80).
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Corte B (%)</FormLabel>
                  <NumberInput
                    min={0.02}
                    max={100}
                    precision={2}
                    step={0.5}
                    value={cutoffB}
                    onChange={(_, value) => setCutoffB(Number.isFinite(value) ? value : 95)}
                    size="sm"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormHelperText>
                    Itens entre o corte A e este valor entram na Classe B (padrão 95). Resto é C.
                  </FormHelperText>
                </FormControl>

                <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }} maxW={{ md: '50%' }}>
                  <FormLabel fontSize="sm">Período de análise (meses)</FormLabel>
                  <NumberInput
                    min={1}
                    max={120}
                    value={analysisPeriodMonths}
                    onChange={(_, value) =>
                      setAnalysisPeriodMonths(Number.isFinite(value) ? Math.trunc(value) : 12)
                    }
                    size="sm"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormHelperText>
                    Janela de saídas usada no valor de consumo (mínimo 1 mês).
                  </FormHelperText>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder} shadow="sm">
            <CardHeader pb={2}>
              <Heading size="sm">Atenção de estoque</Heading>
              <Text fontSize="xs" color={muted} mt={1}>
                Antecedência do alerta = mínimo × fator. Classe C, por padrão, só alerta abaixo do
                mínimo.
              </Text>
            </CardHeader>
            <CardBody pt={2}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm">Fator Classe A</FormLabel>
                  <NumberInput
                    min={0.01}
                    precision={2}
                    step={0.1}
                    value={attentionFactorA}
                    onChange={(_, value) =>
                      setAttentionFactorA(Number.isFinite(value) ? value : 1.5)
                    }
                    size="sm"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormHelperText>
                    Alerta de atenção em mínimo × fator (padrão 1,5).
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Fator Classe B</FormLabel>
                  <NumberInput
                    min={0.01}
                    precision={2}
                    step={0.1}
                    value={attentionFactorB}
                    onChange={(_, value) =>
                      setAttentionFactorB(Number.isFinite(value) ? value : 1.2)
                    }
                    size="sm"
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormHelperText>
                    Alerta de atenção em mínimo × fator (padrão 1,2).
                  </FormHelperText>
                </FormControl>

                <FormControl gridColumn={{ base: 'auto', md: '1 / -1' }}>
                  <HStack>
                    <FormLabel mb={0} fontSize="sm" mr={3}>
                      Atenção para Classe C
                    </FormLabel>
                    <Switch
                      isChecked={attentionEnabledC}
                      onChange={(e) => setAttentionEnabledC(e.target.checked)}
                    />
                  </HStack>
                  <FormHelperText>
                    Se desligado, Classe C só alerta quando o saldo fica abaixo do mínimo.
                  </FormHelperText>
                </FormControl>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      )}

      <Box
        position="sticky"
        bottom={0}
        mt={6}
        py={3}
        px={4}
        mx={{ base: -4, md: 0 }}
        bg={actionsBg}
        borderTopWidth="1px"
        borderColor={actionsBorder}
        zIndex={1}
      >
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          <Button
            colorScheme="blue"
            onClick={() => void handleSave()}
            isLoading={saving}
            isDisabled={loading}
          >
            Salvar configurações
          </Button>
          <Button
            colorScheme="orange"
            variant="outline"
            onClick={() => void handleRecalculate()}
            isLoading={recalculating}
            isDisabled={loading || lastRunStatus === 'RUNNING'}
          >
            Recalcular agora
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
