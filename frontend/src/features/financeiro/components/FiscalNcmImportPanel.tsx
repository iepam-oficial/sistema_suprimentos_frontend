'use client';

import { useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Heading,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Upload } from 'lucide-react';
import {
  importFiscalNcms,
  type FiscalNcmImportResult,
} from '@/features/financeiro/api/fiscalCatalogApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';
import {
  FISCAL_IMPORT_CEST_SNIPPET,
  FISCAL_IMPORT_NCM_SNIPPET,
  parseAndValidateFiscalImportFile,
  type FiscalImportFileKind,
} from '@/features/financeiro/lib/fiscalImportValidation';

interface FiscalNcmImportPanelProps {
  onImported: () => void;
  onRateLimited: () => void;
}

export function FiscalNcmImportPanel({ onImported, onRateLimited }: FiscalNcmImportPanelProps) {
  const ncmInputRef = useRef<HTMLInputElement>(null);
  const cestInputRef = useRef<HTMLInputElement>(null);
  const [ncmFile, setNcmFile] = useState<File | null>(null);
  const [cestFile, setCestFile] = useState<File | null>(null);
  const [ncmError, setNcmError] = useState<string | null>(null);
  const [cestError, setCestError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<FiscalNcmImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetInputs = () => {
    if (ncmInputRef.current) ncmInputRef.current.value = '';
    if (cestInputRef.current) cestInputRef.current.value = '';
  };

  const handleFileSelected = async (kind: FiscalImportFileKind, file: File | null) => {
    setResult(null);
    setError(null);

    if (!file) {
      if (kind === 'ncm') {
        setNcmFile(null);
        setNcmError(null);
      } else {
        setCestFile(null);
        setCestError(null);
      }
      return;
    }

    const parsed = await parseAndValidateFiscalImportFile(file, kind);
    if (!parsed.ok) {
      if (kind === 'ncm') {
        setNcmFile(null);
        setNcmError(parsed.error);
        if (ncmInputRef.current) ncmInputRef.current.value = '';
      } else {
        setCestFile(null);
        setCestError(parsed.error);
        if (cestInputRef.current) cestInputRef.current.value = '';
      }
      return;
    }

    if (kind === 'ncm') {
      setNcmFile(file);
      setNcmError(null);
    } else {
      setCestFile(file);
      setCestError(null);
    }
  };

  const handleImport = async () => {
    if (!ncmFile || !cestFile || ncmError || cestError) return;

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const importResult = await importFiscalNcms(ncmFile, cestFile);
      setResult(importResult);
      setNcmFile(null);
      setCestFile(null);
      setNcmError(null);
      setCestError(null);
      resetInputs();
      onImported();
    } catch (err) {
      if (err instanceof RateLimitError) {
        onRateLimited();
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível importar as tabelas fiscais.',
      );
    } finally {
      setIsImporting(false);
    }
  };

  const canImport = Boolean(ncmFile && cestFile && !ncmError && !cestError);

  const hasCestStats =
    result &&
    (result.cestCreated !== undefined ||
      result.cestUpdated !== undefined ||
      result.cestDeactivated !== undefined);

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Importar tabelas NCM e CEST</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" color="gray.500">
            Envie os JSONs oficiais da tabela de NCM (campo <b>Nomenclaturas</b>) e das tabelas
            CEST. Códigos existentes são atualizados, novos são criados e os ausentes de
            importações anteriores são desativados.
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Modelo NCM
              </Text>
              <Code
                display="block"
                whiteSpace="pre"
                overflowX="auto"
                p={3}
                borderRadius="md"
                fontSize="xs"
                maxH="180px"
              >
                {FISCAL_IMPORT_NCM_SNIPPET}
              </Code>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Modelo CEST
              </Text>
              <Code
                data-testid="fiscal-import-cest-snippet"
                display="block"
                whiteSpace="pre"
                overflowX="auto"
                p={3}
                borderRadius="md"
                fontSize="xs"
                maxH="180px"
              >
                {FISCAL_IMPORT_CEST_SNIPPET}
              </Code>
            </Box>
          </SimpleGrid>

          <HStack spacing={4} align="flex-start" wrap="wrap">
            <input
              ref={ncmInputRef}
              data-testid="fiscal-import-ncm-file"
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void handleFileSelected('ncm', e.target.files?.[0] ?? null);
              }}
            />
            <input
              ref={cestInputRef}
              data-testid="fiscal-import-cest-file"
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void handleFileSelected('cest', e.target.files?.[0] ?? null);
              }}
            />

            <VStack align="stretch" spacing={2}>
              <Button
                leftIcon={<Upload size={16} />}
                onClick={() => ncmInputRef.current?.click()}
                colorScheme="blue"
                variant="outline"
                isDisabled={isImporting}
              >
                Selecionar JSON NCM
              </Button>
              <Text
                fontSize="xs"
                color={ncmError ? 'red.500' : ncmFile ? 'green.600' : 'gray.400'}
                noOfLines={1}
                maxW="240px"
              >
                {ncmError ?? (ncmFile ? ncmFile.name : 'Nenhum arquivo selecionado')}
              </Text>
            </VStack>

            <VStack align="stretch" spacing={2}>
              <Button
                leftIcon={<Upload size={16} />}
                onClick={() => cestInputRef.current?.click()}
                colorScheme="blue"
                variant="outline"
                isDisabled={isImporting}
              >
                Selecionar JSON CEST
              </Button>
              <Text
                fontSize="xs"
                color={cestError ? 'red.500' : cestFile ? 'green.600' : 'gray.400'}
                noOfLines={1}
                maxW="240px"
              >
                {cestError ?? (cestFile ? cestFile.name : 'Nenhum arquivo selecionado')}
              </Text>
            </VStack>

            <Button
              colorScheme="blue"
              onClick={handleImport}
              isLoading={isImporting}
              isDisabled={!canImport}
              alignSelf="flex-start"
            >
              Importar tabelas
            </Button>
          </HStack>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert
              status="success"
              borderRadius="md"
              flexDirection="column"
              alignItems="stretch"
              data-testid="fiscal-import-success"
            >
              <HStack>
                <AlertIcon />
                <AlertTitle>Importação concluída</AlertTitle>
              </HStack>
              <Text fontSize="sm" mt={2} color="gray.600">
                Versão: {result.versionId}
              </Text>

              <Text fontSize="sm" fontWeight="medium" mt={3}>
                NCM
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={1}>
                <Stat>
                  <StatLabel>Criados</StatLabel>
                  <StatNumber>{result.created}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Atualizados</StatLabel>
                  <StatNumber>{result.updated}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Desativados</StatLabel>
                  <StatNumber>{result.deactivated}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Ignorados</StatLabel>
                  <StatNumber>{result.skipped}</StatNumber>
                </Stat>
              </SimpleGrid>

              {hasCestStats && (
                <>
                  <Divider my={3} />
                  <Text fontSize="sm" fontWeight="medium">
                    CEST
                  </Text>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mt={1}>
                    <Stat>
                      <StatLabel>Criados</StatLabel>
                      <StatNumber>{result.cestCreated ?? 0}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Atualizados</StatLabel>
                      <StatNumber>{result.cestUpdated ?? 0}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Desativados</StatLabel>
                      <StatNumber>{result.cestDeactivated ?? 0}</StatNumber>
                    </Stat>
                  </SimpleGrid>
                </>
              )}
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
