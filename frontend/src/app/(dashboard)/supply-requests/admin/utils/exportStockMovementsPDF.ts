import { exportToPDF } from '@/utils/exportToPDF';
import type { StockMovement } from '@/features/catalog/types';
import { buildStockMovementPdfRow } from './stockMovementFormatters';

const PDF_HEAD = [
  'Suprimento',
  'Tipo',
  'De',
  'Para',
  'Quantidade',
  'Custo Unit.',
  'Custo Total',
  'Lote/Fornecedor',
  'Setor',
  'Polo',
  'Data',
];

export async function exportStockMovementsPDF(
  movements: StockMovement[],
): Promise<void> {
  await exportToPDF({
    title: 'Relatório de Movimentações de Estoque',
    head: PDF_HEAD,
    body: movements.map(buildStockMovementPdfRow),
    fileName: 'movimentacoes_estoque.pdf',
    orientation: 'landscape',
  });
}
