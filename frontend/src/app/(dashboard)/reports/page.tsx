'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Skeleton,
  useBreakpointValue,
  useColorMode,
  useToast,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { REPORT_CATALOG } from '@/lib/reports/catalog';
import {
  ExecutiveSummaryPayload,
  FilterOptions,
  ReportPayload,
  ReportSlug,
} from '@/lib/reports/types';
import { MobileReports } from './components/MobileReports';
import { ReportCatalog } from './components/ReportCatalog';
import {
  buildReportsQuery,
  ReportFiltersBar,
  ReportFiltersState,
} from './components/ReportFilters';
import { ReportViewer } from './components/ReportViewer';

const DEFAULT_SLUG: ReportSlug = 'executive-summary';

const SLUG_ALIASES: Record<string, ReportSlug> = {
  inventory: 'inventory-overview',
  'inventory-overview': 'inventory-overview',
};

function resolveSlugFromParams(report: string | null): ReportSlug {
  if (!report) return DEFAULT_SLUG;
  const mapped = SLUG_ALIASES[report] ?? report;
  const found = REPORT_CATALOG.find((r) => r.slug === mapped);
  return found ? found.slug : DEFAULT_SLUG;
}

/** Thin horizontal rule used as a section divider */
function Divider({ colorMode }: { colorMode: string }) {
  return (
    <Box
      h="1px"
      bg={colorMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}
    />
  );
}

function ReportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const [activeSlug, setActiveSlug] = useState<ReportSlug>(() =>
    resolveSlugFromParams(searchParams.get('report'))
  );
  const [filters, setFilters] = useState<ReportFiltersState>({
    timeRange: searchParams.get('timeRange') || '30',
    locationId: searchParams.get('locationId') || '',
    sectorId: searchParams.get('sectorId') || '',
    supplierId: searchParams.get('supplierId') || '',
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [reportData, setReportData] = useState<ReportPayload | ExecutiveSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const syncUrl = useCallback(
    (slug: ReportSlug, f: ReportFiltersState) => {
      const q = buildReportsQuery(slug, f);
      router.replace(`/reports?${q}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');

    if (!token) {
      router.push('/login');
      return;
    }

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar relatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
    }
  }, [router, toast]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    async function loadFilterOptions() {
      setFiltersLoading(true);
      try {
        const res = await fetch('/api/reports?report=filters', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 429) { router.push('/rate-limit'); return; }
        if (res.ok) setFilterOptions(await res.json());
      } catch { /* ignore */ } finally {
        setFiltersLoading(false);
      }
    }

    loadFilterOptions();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    async function loadReport() {
      setLoading(true);
      try {
        const query = buildReportsQuery(activeSlug, filters);
        const res = await fetch(`/api/reports?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 429) { router.push('/rate-limit'); return; }
        if (!res.ok) throw new Error('Erro ao carregar relatório');
        const data = await res.json();
        setReportData(data);
        syncUrl(activeSlug, filters);
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o relatório',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setReportData(null);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [activeSlug, filters, router, syncUrl, toast]);

  const handleSlugChange = (slug: ReportSlug) => setActiveSlug(slug);
  const handleFiltersChange = (f: ReportFiltersState) => setFilters(f);

  /* ── tokens ─────────────────────────────────────────────────── */
  const pageBg     = isDark ? 'gray.950'              : 'gray.50';
  const panelBg    = isDark ? 'gray.900'              : 'white';
  const borderClr  = isDark ? 'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.08)';
  const mutedText  = isDark ? 'gray.400'              : 'gray.500';
  const headingClr = isDark ? 'white'                 : 'gray.900';

  if (isMobile) {
    return (
      <MobileReports
        activeSlug={activeSlug}
        onSlugChange={handleSlugChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        filterOptions={filterOptions}
        reportData={reportData}
        loading={loading}
      />
    );
  }

  return (
    <Flex
      direction="column"
      minH="100vh"
      bg={pageBg}
      px={{ base: 4, md: 8, xl: 10 }}
      py={8}
      gap={0}
    >
      {/* ── Page header ──────────────────────────────────────── */}
      <Flex
        align="flex-end"
        justify="space-between"
        mb={6}
        pb={6}
        borderBottom="1px solid"
        borderColor={borderClr}
      >
        <VStack align="flex-start" spacing={1}>
          <Text
            fontSize="xs"
            fontWeight="600"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color={mutedText}
          >
            Painel de dados
          </Text>
          <Heading
            size="xl"
            fontWeight="700"
            color={headingClr}
            letterSpacing="-0.02em"
          >
            Relatórios
          </Heading>
        </VStack>

        {/* Live indicator */}
        <HStack spacing={2} mb={1}>
          <Box
            w="7px"
            h="7px"
            borderRadius="full"
            bg="green.400"
            boxShadow="0 0 0 3px rgba(72,187,120,0.25)"
          />
          <Text fontSize="xs" fontWeight="500" color={mutedText}>
            Dados em tempo real
          </Text>
        </HStack>
      </Flex>

      {/* ── Filters bar ──────────────────────────────────────── */}
      <Box
        mb={6}
        p={4}
        bg={panelBg}
        border="1px solid"
        borderColor={borderClr}
        borderRadius="12px"
        boxShadow={isDark ? 'none' : 'sm'}
      >
        {filtersLoading ? (
          <Skeleton height="48px" borderRadius="8px" />
        ) : (
          <ReportFiltersBar
            filters={filters}
            filterOptions={filterOptions}
            onChange={handleFiltersChange}
          />
        )}
      </Box>

      {/* ── Main two-column grid ──────────────────────────────── */}
      <Grid
        templateColumns={{ base: '1fr', xl: '280px 1fr' }}
        gap={5}
        flex={1}
        alignItems="start"
      >
        {/* Left: catalog sidebar */}
        <GridItem>
          <Box
            bg={panelBg}
            border="1px solid"
            borderColor={borderClr}
            borderRadius="12px"
            boxShadow={isDark ? 'none' : 'sm'}
            overflow="hidden"
            position="sticky"
            top="24px"
          >
            {/* Sidebar header */}
            <Flex
              px={4}
              py={3}
              align="center"
              justify="space-between"
              borderBottom="1px solid"
              borderColor={borderClr}
            >
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color={mutedText}
              >
                Categorias
              </Text>
              <Badge
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                colorScheme="blue"
                variant="subtle"
              >
                {REPORT_CATALOG.length}
              </Badge>
            </Flex>

            <Box
              overflowY="auto"
              maxH="calc(100vh - 280px)"
              px={2}
              py={2}
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  borderRadius: '99px',
                },
              }}
            >
              <ReportCatalog activeSlug={activeSlug} onSelect={handleSlugChange} />
            </Box>
          </Box>
        </GridItem>

        {/* Right: report viewer */}
        <GridItem>
          <Box
            bg={panelBg}
            border="1px solid"
            borderColor={borderClr}
            borderRadius="12px"
            boxShadow={isDark ? 'none' : 'sm'}
            overflow="hidden"
            minH="500px"
          >
            {/* Viewer toolbar */}
            <Flex
              px={5}
              py={3}
              align="center"
              borderBottom="1px solid"
              borderColor={borderClr}
            >
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                bg={loading ? 'orange.400' : 'green.400'}
                boxShadow={
                  loading
                    ? '0 0 0 3px rgba(251,140,0,0.2)'
                    : '0 0 0 3px rgba(72,187,120,0.2)'
                }
                mr={3}
                transition="background 0.3s"
              />
              <Text fontSize="xs" fontWeight="600" color={mutedText}>
                {loading ? 'Carregando relatório…' : 'Relatório carregado'}
              </Text>
            </Flex>

            {/* Content */}
            <Box p={6}>
              {loading ? (
                <VStack spacing={4} align="stretch">
                  <Skeleton height="80px"  borderRadius="8px" />
                  <Skeleton height="260px" borderRadius="8px" />
                  <Skeleton height="160px" borderRadius="8px" />
                </VStack>
              ) : (
                <ReportViewer
                  data={reportData}
                  loading={false}
                  filters={filters}
                  filterOptions={filterOptions}
                />
              )}
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Flex>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <Box p={8} minH="100vh" bg="gray.50">
          <Skeleton height="36px" width="180px" mb={2} borderRadius="8px" />
          <Skeleton height="16px" width="120px" mb={8} borderRadius="6px" />
          <Skeleton height="72px" mb={5} borderRadius="12px" />
          <Grid templateColumns="280px 1fr" gap={5}>
            <Skeleton height="480px" borderRadius="12px" />
            <Skeleton height="480px" borderRadius="12px" />
          </Grid>
        </Box>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}