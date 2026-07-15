import { exportToPDF } from '@/utils/exportToPDF';
import type { SupplyTransaction } from '@/features/catalog/types';
import { buildSupplyTransactionPdfRow } from './supplyTransactionFormatters';

const PDF_HEAD = [
  'Suprimento',
  'Tipo',
  'Movimento',
  'De',
  'Para',
  'Quantidade',
  'Preço Unit.',
  'Valor Total',
  'Setor',
  'Polo',
  'Data',
];

export async function exportSupplyTransactionsPDF(
  transactions: SupplyTransaction[],
): Promise<void> {
  await exportToPDF({
    title: 'Relatório de Transações de Suprimentos',
    head: PDF_HEAD,
    body: transactions.map(buildSupplyTransactionPdfRow),
    fileName: 'transacoes_suprimentos.pdf',
    orientation: 'landscape',
  });
}
