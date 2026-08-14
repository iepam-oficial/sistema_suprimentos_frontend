'use client';

import { Box, Button, HStack, Tooltip } from '@chakra-ui/react';
import { Download, FileText } from 'lucide-react';
import { exportToPDF } from '@/utils/exportToPDF';
import { exportToCSV } from '@/utils/exportToCSV';

interface ReportExportActionsProps {
  title: string;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  fileBaseName: string;
  /** When true, PDF/CSV buttons are disabled (e.g. no columns selected). */
  disabled?: boolean;
  disabledReason?: string;
}

export function ReportExportActions({
  title,
  tableHeaders,
  tableRows,
  fileBaseName,
  disabled = false,
  disabledReason = 'Selecione ao menos uma coluna para exportar.',
}: ReportExportActionsProps) {
  const handlePDF = () => {
    if (disabled) return;
    exportToPDF({
      title,
      head: tableHeaders,
      body: tableRows,
      fileName: `${fileBaseName}.pdf`,
    });
  };

  const handleCSV = () => {
    if (disabled) return;
    exportToCSV({
      head: tableHeaders,
      body: tableRows,
      fileName: `${fileBaseName}.csv`,
    });
  };

  return (
    <HStack spacing={2}>
      <Tooltip label={disabledReason} isDisabled={!disabled}>
        <Box>
          <Button
            size="sm"
            leftIcon={<FileText size={16} />}
            onClick={handlePDF}
            colorScheme="red"
            variant="outline"
            isDisabled={disabled}
            title={disabled ? disabledReason : undefined}
          >
            Exportar PDF
          </Button>
        </Box>
      </Tooltip>
      <Tooltip label={disabledReason} isDisabled={!disabled}>
        <Box>
          <Button
            size="sm"
            leftIcon={<Download size={16} />}
            onClick={handleCSV}
            colorScheme="green"
            variant="outline"
            isDisabled={disabled}
            title={disabled ? disabledReason : undefined}
          >
            Exportar CSV
          </Button>
        </Box>
      </Tooltip>
    </HStack>
  );
}
