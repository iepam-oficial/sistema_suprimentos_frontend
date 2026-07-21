'use client';

import { useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import { Upload } from 'lucide-react';
import {
  importFiscalNcms,
  type FiscalNcmImportResult,
} from '@/features/financeiro/api/fiscalCatalogApi';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

interface FiscalNcmImportPanelProps {
  onImported: () => void;
  onRateLimited: () => void;
}

export function FiscalNcmImportPanel({ onImported, onRateLimited }: FiscalNcmImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<FiscalNcmImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const importResult = await importFiscalNcms(file);
      setResult(importResult);
      onImported();
    } catch (err) {
      if (err instanceof RateLimitError) {
        onRateLimited();
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível importar o arquivo de NCMs.',
      );
    } finally {
      setIsImporting(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Importar tabela de NCM</Heading>
      </CardHeader>
      <CardBody>
        <HStack spacing={4} align="flex-start" wrap="wrap">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelected(file);
              }
            }}
          />
          <Button
            leftIcon={<Upload size={16} />}
            onClick={() => inputRef.current?.click()}
            isLoading={isImporting}
            colorScheme="blue"
            variant="outline"
          >
            Selecionar arquivo JSON
          </Button>
          <Text fontSize="sm" color="gray.500" maxW="480px">
            Envie o JSON oficial da tabela de NCM (campo <b>Nomenclaturas</b>). Códigos existentes
            são atualizados, novos são criados e os ausentes de importações anteriores são
            desativados.
          </Text>
        </HStack>

        {error && (
          <Alert status="error" mt={4} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert status="success" mt={4} borderRadius="md" flexDirection="column" alignItems="stretch">
            <HStack>
              <AlertIcon />
              <AlertTitle>Importação concluída</AlertTitle>
            </HStack>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={3}>
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
          </Alert>
        )}
      </CardBody>
    </Card>
  );
}
