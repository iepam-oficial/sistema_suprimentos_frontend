'use client';

import { Button, HStack } from '@chakra-ui/react';
import { Download, FileText } from 'lucide-react';
import { exportToPDF } from '@/utils/exportToPDF';
import { exportToCSV } from '@/utils/exportToCSV';

interface ReportExportActionsProps {
  title: string;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  fileBaseName: string;
}

export function ReportExportActions({
  title,
  tableHeaders,
  tableRows,
  fileBaseName,
}: ReportExportActionsProps) {
  const handlePDF = () => {
    exportToPDF({
      title,
      head: tableHeaders,
      body: tableRows,
      fileName: `${fileBaseName}.pdf`,
    });
  };

  const handleCSV = () => {
    exportToCSV({
      head: tableHeaders,
      body: tableRows,
      fileName: `${fileBaseName}.csv`,
    });
  };

  return (
    <HStack spacing={2}>
      <Button size="sm" leftIcon={<FileText size={16} />} onClick={handlePDF} colorScheme="red" variant="outline">
        Exportar PDF
      </Button>
      <Button size="sm" leftIcon={<Download size={16} />} onClick={handleCSV} colorScheme="green" variant="outline">
        Exportar CSV
      </Button>
    </HStack>
  );
}
