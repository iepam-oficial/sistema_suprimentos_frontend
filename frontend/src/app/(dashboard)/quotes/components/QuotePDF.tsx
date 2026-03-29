import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL, mulMoney } from '@/utils/money';

interface QuotePDFProps {
  quote: {
    id: string;
    supplier: string;
    supplier_contact: string | null;
    status: string;
    notes: string | null;
    total_value: number;
    created_at: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
    }>;
  };
}

export function generateQuotePDF({ quote }: QuotePDFProps) {
  const doc = new jsPDF();

  // Configurações do documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Cotação de Suprimentos', 105, 20, { align: 'center' });

  // Informações da cotação
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número da Cotação: ${quote.id}`, 20, 40);
  doc.text(`Fornecedor: ${quote.supplier}`, 20, 50);
  if (quote.supplier_contact) {
    doc.text(`Contato: ${quote.supplier_contact}`, 20, 60);
  }
  doc.text(`Data: ${format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: ptBR })}`, 20, 70);
  doc.text(`Status: ${quote.status}`, 20, 80);

  // Tabela de itens
  const tableColumn = ['Produto', 'Quantidade', 'Preço Unitário', 'Total'];
  const tableRows = quote.items.map(item => [
    item.product_name,
    item.quantity.toString(),
    formatBRL(item.unit_price),
    formatBRL(mulMoney(item.unit_price, item.quantity)),
  ]);

  // Adiciona o total
  tableRows.push(['', '', 'Total:', formatBRL(quote.total_value)]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 90,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });

  // Observações
  if (quote.notes) {
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 20, finalY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.notes, 20, finalY + 30);
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      'Este documento foi gerado automaticamente pelo sistema de Cotações de Suprimentos',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc;
} 