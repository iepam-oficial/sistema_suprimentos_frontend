'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Upload } from 'lucide-react';
import type { DepreciationImportResultDTO } from '@ti-assistant/contracts';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import { importDepreciationRates } from '@/features/inventory/api/depreciationRateApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

interface ImportDepreciationRatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_DETAIL_ROWS = 5;

function parseImportRows(text: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Arquivo JSON inválido.');
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    'rows' in parsed &&
    Array.isArray((parsed as { rows: unknown }).rows)
  ) {
    return (parsed as { rows: unknown[] }).rows;
  }

  throw new Error(
    'O JSON deve ser um array ou um objeto com campo "rows" contendo um array.'
  );
}

export function ImportDepreciationRatesDialog({
  isOpen,
  onClose,
  onSuccess,
}: ImportDepreciationRatesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [defaultChartOfAccountId, setDefaultChartOfAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<DepreciationImportResultDTO | null>(null);

  const resetForm = () => {
    setDefaultChartOfAccountId('');
    setSelectedFile(null);
    setFileError(null);
    setChartError(null);
    setImportError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    resetForm();

    const loadAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const accounts = await fetchChartOfAccounts('ATIVO');
        setChartOfAccounts(accounts);
      } catch {
        setImportError('Não foi possível carregar os planos de contas.');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    void loadAccounts();
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelected = (file: File | null) => {
    setResult(null);
    setImportError(null);
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setSelectedFile(null);
      setFileError('Selecione um arquivo .json.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = async () => {
    setImportError(null);
    setChartError(null);
    setFileError(null);
    setResult(null);

    if (!defaultChartOfAccountId) {
      setChartError('Plano de contas padrão é obrigatório.');
      return;
    }

    if (!selectedFile) {
      setFileError('Selecione um arquivo JSON.');
      return;
    }

    setIsImporting(true);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const text = await selectedFile.text();
      const rows = parseImportRows(text);

      if (rows.length === 0) {
        throw new Error('O arquivo não contém linhas para importar.');
      }

      const importResult = await importDepreciationRates(token, {
        rows,
        default_chart_of_account_id: defaultChartOfAccountId,
      });

      setResult(importResult);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onSuccess();
    } catch (error) {
      if (error instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      setImportError(
        error instanceof Error
          ? error.message
          : 'Não foi possível importar as taxas de depreciação.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const canImport = Boolean(
    defaultChartOfAccountId && selectedFile && !fileError && !isImporting
  );

  const detailPreview = result?.details?.slice(0, MAX_DETAIL_ROWS) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Importar taxas de depreciação</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.500">
              Envie um arquivo JSON com as regras de depreciação. O arquivo pode ser um
              array de objetos ou um objeto com o campo <b>rows</b>.
            </Text>

            <FormControl isRequired isInvalid={!!chartError}>
              <FormLabel>Plano de contas padrão</FormLabel>
              <Select
                placeholder="Selecione o plano de contas padrão"
                value={defaultChartOfAccountId}
                onChange={(e) => {
                  setDefaultChartOfAccountId(e.target.value);
                  setChartError(null);
                }}
                isDisabled={isLoadingAccounts || isImporting}
              >
                {chartOfAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.codigo} — {account.nome}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{chartError}</FormErrorMessage>
            </FormControl>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
            />

            <VStack align="stretch" spacing={2}>
              <Button
                leftIcon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                colorScheme="blue"
                variant="outline"
                isDisabled={isImporting}
              >
                Selecionar arquivo JSON
              </Button>
              <Text
                fontSize="sm"
                color={fileError ? 'red.500' : selectedFile ? 'green.600' : 'gray.500'}
              >
                {fileError ??
                  (selectedFile ? selectedFile.name : 'Nenhum arquivo selecionado')}
              </Text>
            </VStack>

            {importError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert
                status="success"
                borderRadius="md"
                flexDirection="column"
                alignItems="stretch"
              >
                <HStack>
                  <AlertIcon />
                  <AlertTitle>Importação concluída</AlertTitle>
                </HStack>

                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={3}>
                  <Stat>
                    <StatLabel>Criadas</StatLabel>
                    <StatNumber>{result.created}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Atualizadas</StatLabel>
                    <StatNumber>{result.updated}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Ignoradas</StatLabel>
                    <StatNumber>{result.skipped}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Inválidas</StatLabel>
                    <StatNumber>{result.invalid}</StatNumber>
                  </Stat>
                </SimpleGrid>

                {detailPreview.length > 0 && (
                  <VStack align="stretch" spacing={1} mt={3}>
                    <Text fontSize="sm" fontWeight="medium">
                      Detalhes (primeiras {detailPreview.length})
                    </Text>
                    {detailPreview.map((detail) => (
                      <Text key={detail.index} fontSize="xs" color="gray.600">
                        Linha {detail.index + 1}: {detail.reason}
                        {detail.description ? ` — ${detail.description}` : ''}
                        {detail.ncm ? ` (NCM ${detail.ncm})` : ''}
                      </Text>
                    ))}
                    {(result.details?.length ?? 0) > MAX_DETAIL_ROWS && (
                      <Text fontSize="xs" color="gray.500">
                        … e mais {(result.details?.length ?? 0) - MAX_DETAIL_ROWS} linha(s)
                      </Text>
                    )}
                  </VStack>
                )}
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isImporting}>
            Fechar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleImport}
            isLoading={isImporting}
            isDisabled={!canImport}
          >
            Importar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
