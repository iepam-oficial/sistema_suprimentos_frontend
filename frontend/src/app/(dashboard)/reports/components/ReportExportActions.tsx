'use client';

import { Box, Button, HStack, Tooltip } from '@chakra-ui/react';
import { Download, FileText } from 'lucide-react';
import type { ExcelSheetInput } from '@/utils/exportToExcel';
import { exportToExcel } from '@/utils/exportToExcel';
import { exportToPDF } from '@/utils/exportToPDF';

interface ReportExportActionsProps {
  excelFileName: string;
  sheets: ExcelSheetInput[];
  pdfTitle: string;
  pdfHeaders: string[];
  pdfRows: (string | number)[][];
  pdfFileName: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function ReportExportActions({
  excelFileName,
  sheets,
  pdfTitle,
  pdfHeaders,
  pdfRows,
  pdfFileName,
  disabled = false,
  disabledReason = 'Selecione ao menos uma coluna para exportar.',
}: ReportExportActionsProps) {
  const handleExcel = () => {
    if (disabled) return;
    exportToExcel({ fileName: excelFileName, sheets }).catch(console.error);
  };

  const handlePDF = () => {
    if (disabled) return;
    exportToPDF({
      title: pdfTitle,
      head: pdfHeaders,
      body: pdfRows,
      fileName: pdfFileName,
    });
  };

  return (
    <HStack spacing={2}>
      <Tooltip label={disabledReason} isDisabled={!disabled}>
        <Box>
          <Button
            size="sm"
            leftIcon={<Download size={16} />}
            onClick={handleExcel}
            colorScheme="green"
            variant="outline"
            isDisabled={disabled}
            title={disabled ? disabledReason : undefined}
            data-testid="reports-export-excel"
          >
            Exportar Excel
          </Button>
        </Box>
      </Tooltip>
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
            data-testid="reports-export-pdf"
          >
            Exportar PDF
          </Button>
        </Box>
      </Tooltip>
    </HStack>
  );
}
