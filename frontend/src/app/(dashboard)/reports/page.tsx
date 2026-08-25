'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Select,
  Skeleton,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorMode,
  useDisclosure,
  useToast,
  Button,
  VStack,
} from '@chakra-ui/react';
import { Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';
import {
  fetchReport,
  fetchReportFilters,
  isDetailEnrichedSlug,
  isStockReportSlug,
  RateLimitError,
} from '@/features/reports/api/reportApi';
import { buildStockExportTable } from '@/features/reports/columnSelection';
import { REPORT_CATALOG } from '@/features/reports/catalog';
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
import { MobileReports } from './components/MobileReports';
import {
  ReportColumnPicker,
  useReportColumnSelection,
} from './components/ReportColumnPicker';
import {
  buildReportsQuery,
  EMPTY_FILTERS,
  hasNonDefaultFilters,
  parseCsvParam,
  ReportFiltersFields,
  ReportFiltersState,
  toReportFiltersQuery,
} from './components/ReportFilters';
import { ReportExportActions } from './components/ReportExportActions';
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

function isSimpleReport(
  data: ReportPayload | ExecutiveSummaryPayload | null
): data is ReportPayload {
  return !!data && data.slug !== 'executive-summary';
}

function ReportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [activeSlug, setActiveSlug] = useState<ReportSlug>(() =>
    resolveSlugFromParams(searchParams.get('report'))
  );
  const [filters, setFilters] = useState<ReportFiltersState>({
    timeRange: searchParams.get('timeRange') || '30',
    locationId: searchParams.get('locationId') || '',
    sectorId: searchParams.get('sectorId') || '',
    supplierId: searchParams.get('supplierId') || '',
    categoryId: searchParams.get('categoryId') || '',
    subcategoryId: searchParams.get('subcategoryId') || '',
    ncmIds: parseCsvParam(searchParams.get('ncmIds')),
    cestCodes: parseCsvParam(searchParams.get('cestCodes')),
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [reportData, setReportData] = useState<ReportPayload | ExecutiveSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const syncUrl = useCallback((slug: ReportSlug, f: ReportFiltersState) => {
    if (typeof window === 'undefined') return;
    const q = buildReportsQuery(slug, f);
    const hash = window.location.hash;
    const next = `/reports?${q}${hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current === next) return;
    window.history.replaceState(window.history.state, '', next);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');

    if (!token) {
      router.push('/login');
      return;
    }

    const access = assertPageAccess(resolveUserRoles(user), ['ADMIN', 'MANAGER']);
    if (!access.allowed) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar relatórios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push(access.redirectTo);
    }
  }, [router, toast]);

  useEffect(() => {
    const storedToken = localStorage.getItem('@ti-assistant:token');
    if (!storedToken) return;
    const token: string = storedToken;

    async function loadFilterOptions() {
      setFiltersLoading(true);
      try {
        const options = await fetchReportFilters(token);
        setFilterOptions(options);
      } catch (error) {
        if (error instanceof RateLimitError) {
          router.push('/rate-limit');
        }
      } finally {
        setFiltersLoading(false);
      }
    }

    loadFilterOptions();
  }, [router]);

  useEffect(() => {
    syncUrl(activeSlug, filters);
  }, [activeSlug, filters, syncUrl]);

  useEffect(() => {
    const storedToken = localStorage.getItem('@ti-assistant:token');
    if (!storedToken) return;
    const token: string = storedToken;
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      try {
        const data = await fetchReport(
          token,
          activeSlug,
          toReportFiltersQuery(activeSlug, filters),
          controller.signal
        );
        if (controller.signal.aborted) return;
        setReportData(data);
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === 'AbortError') ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          return;
        }
        if (error instanceof RateLimitError) {
          router.push('/rate-limit');
          return;
        }
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o relatório',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setReportData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReport();
    return () => controller.abort();
  }, [activeSlug, filters, router, toast]);

  useEffect(() => {
    if (loading) return;
    if (typeof window === 'undefined') return;
    if (!window.location.hash) return;

    const target = document.querySelector(window.location.hash);
    if (!target) return;

    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [loading]);

  const handleSlugChange = (slug: ReportSlug) => {
    setActiveSlug(slug);
    syncUrl(slug, filters);
  };
  const handleFiltersChange = (f: ReportFiltersState) => {
    setFilters(f);
    syncUrl(activeSlug, f);
  };

  const pageBg = isDark ? 'gray.950' : 'gray.50';
  const panelBg = isDark ? 'gray.900' : 'white';
  const borderClr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const headingClr = isDark ? 'white' : 'gray.900';
  const drawerBg = isDark ? 'gray.800' : 'white';
  const filtersActive = hasNonDefaultFilters(filters, activeSlug);
  const activeTitle =
    REPORT_CATALOG.find((r) => r.slug === activeSlug)?.title ??
    (isSimpleReport(reportData) ? reportData.title : 'Relatórios');
  const showToolbarExport = isSimpleReport(reportData) && !loading;

  const columnPickerPayload =
    isSimpleReport(reportData) &&
    reportData.columnKeys &&
    reportData.columnKeys.length > 0 &&
    (isStockReportSlug(reportData.slug) ||
      isDetailEnrichedSlug(reportData.slug))
      ? {
          slug: reportData.slug,
          columnKeys: reportData.columnKeys,
          detailColumnKeys: reportData.detailColumnKeys,
        }
      : null;

  const {
    selection: columnSelection,
    setSelection: setColumnSelection,
    canExport: columnCanExport,
  } = useReportColumnSelection(columnPickerPayload);

  const showColumnPicker = Boolean(columnPickerPayload) && !loading;

  const excelTable = useMemo(() => {
    if (!isSimpleReport(reportData)) {
      return { headers: [] as string[], rows: [] as (string | number)[][] };
    }
    if (columnPickerPayload) {
      return buildStockExportTable(reportData, columnSelection);
    }
    return {
      headers: reportData.tableHeaders,
      rows: reportData.tableRows,
    };
  }, [reportData, columnPickerPayload, columnSelection]);

  const excelSheets = useMemo(() => {
    if (!isSimpleReport(reportData)) return [];
    if (reportData.tabDimensionKey || reportData.summaryHeaders) {
      return toExcelSheetsFromTabbedReport(reportData, excelTable, {
        columnSelection: columnPickerPayload ? columnSelection : undefined,
      });
    }
    return toExcelSheetsFromReportPayload(reportData, excelTable);
  }, [reportData, excelTable, columnPickerPayload, columnSelection]);

  const pdfTable = useMemo(() => {
    if (!isSimpleReport(reportData)) {
      return { headers: [] as string[], rows: [] as (string | number)[][] };
    }
    return buildPdfExportTable(reportData);
  }, [reportData]);

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
    <Box h="100vh" display="flex" flexDirection="column" overflow="hidden" bg={pageBg} px={2} py={2}>
      <Flex
        direction="column"
        flex="1"
        minH={0}
        bg={panelBg}
        border="1px solid"
        borderColor={borderClr}
        borderRadius="md"
        overflow="hidden"
      >
        {/* Toolbar: Select → Filter → title → Export */}
        <HStack
          data-testid="reports-toolbar"
          spacing={2}
          px={3}
          py={2}
          flexShrink={0}
          borderBottom="1px solid"
          borderColor={borderClr}
          flexWrap="wrap"
        >
          <Select
            data-testid="reports-select"
            size="sm"
            maxW="260px"
            value={activeSlug}
            onChange={(e) => handleSlugChange(e.target.value as ReportSlug)}
            bg={isDark ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
          >
            {REPORT_CATALOG.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.title}
              </option>
            ))}
          </Select>

          <Tooltip label="Filtros">
            <Box position="relative">
              <IconButton
                data-testid="reports-filter-button"
                aria-label="Filtros"
                icon={<Filter size={16} />}
                size="sm"
                variant="ghost"
                onClick={onOpen}
                isLoading={filtersLoading}
              />
              {filtersActive && (
                <Badge
                  data-testid="reports-filter-badge"
                  position="absolute"
                  top="-1"
                  right="-1"
                  borderRadius="full"
                  boxSize="2.5"
                  colorScheme="blue"
                  p={0}
                />
              )}
            </Box>
          </Tooltip>

          <Text
            data-testid="reports-active-title"
            flex="1"
            minW="120px"
            fontSize="sm"
            fontWeight="600"
            color={headingClr}
            noOfLines={1}
          >
            {activeTitle}
          </Text>

          {showColumnPicker && isSimpleReport(reportData) && (
            <ReportColumnPicker
              summaryKeys={reportData.columnKeys!}
              summaryHeaders={reportData.tableHeaders}
              detailKeys={reportData.detailColumnKeys}
              detailHeaders={reportData.detailHeaders}
              selection={columnSelection}
              onChange={setColumnSelection}
            />
          )}

          {showToolbarExport && isSimpleReport(reportData) ? (
            <Box data-testid="reports-export" flexShrink={0}>
              <ReportExportActions
                excelFileName={reportExportFileName(reportData.slug, 'xlsx')}
                sheets={excelSheets}
                pdfTitle={reportData.title}
                pdfHeaders={pdfTable.headers}
                pdfRows={pdfTable.rows}
                pdfFileName={reportExportFileName(reportData.slug, 'pdf')}
                disabled={showColumnPicker && !columnCanExport}
              />
            </Box>
          ) : null}
        </HStack>

        {/* Scrollable content */}
        <Box
          flex="1"
          minH={0}
          overflowY="auto"
          p={4}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
              borderRadius: '99px',
            },
          }}
        >
          {loading ? (
            <VStack spacing={4} align="stretch">
              <Skeleton height="80px" borderRadius="8px" />
              <Skeleton height="260px" borderRadius="8px" />
              <Skeleton height="160px" borderRadius="8px" />
            </VStack>
          ) : (
            <ReportViewer
              data={reportData}
              loading={false}
              filters={filters}
              filterOptions={filterOptions}
              hideChrome
              columnSelection={showColumnPicker ? columnSelection : undefined}
            />
          )}
        </Box>
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent
          data-testid="reports-filter-drawer"
          bg={drawerBg}
          borderLeft="1px solid"
          borderColor={borderClr}
        >
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid" borderColor={borderClr}>
            <HStack spacing={2}>
              <Filter size={20} />
              <Text>Filtros</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <Box pt={4}>
              {filtersLoading ? (
                <Skeleton height="200px" borderRadius="8px" />
              ) : (
                <ReportFiltersFields
                  filters={filters}
                  filterOptions={filterOptions}
                  onChange={handleFiltersChange}
                  activeSlug={activeSlug}
                />
              )}
            </Box>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor={borderClr}>
            <Button
              data-testid="reports-filter-clear"
              variant="outline"
              size="sm"
              w="full"
              onClick={() => handleFiltersChange(EMPTY_FILTERS)}
              isDisabled={!filtersActive}
            >
              Limpar filtros
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <Box h="100vh" display="flex" flexDirection="column" overflow="hidden" bg="gray.50" px={2} py={2}>
          <Flex
            direction="column"
            flex="1"
            minH={0}
            bg="white"
            border="1px solid"
            borderColor="rgba(0,0,0,0.08)"
            borderRadius="md"
            overflow="hidden"
          >
            <HStack spacing={2} px={3} py={2} borderBottom="1px solid" borderColor="rgba(0,0,0,0.08)">
              <Skeleton height="32px" width="220px" borderRadius="6px" />
              <Skeleton height="32px" width="32px" borderRadius="6px" />
              <Skeleton height="20px" flex="1" borderRadius="6px" />
            </HStack>
            <Box flex="1" p={4}>
              <VStack spacing={4} align="stretch">
                <Skeleton height="80px" borderRadius="8px" />
                <Skeleton height="260px" borderRadius="8px" />
                <Skeleton height="160px" borderRadius="8px" />
              </VStack>
            </Box>
          </Flex>
        </Box>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
