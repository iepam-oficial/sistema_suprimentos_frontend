import type { DeliveryReportPayloadDTO } from '@ti-assistant/contracts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDF_TITLE = 'Relatório de Entrega de Suprimentos';
export const DELIVERY_REPORT_TABLE_HEAD = ['Suprimento', 'Quantidade', 'Unidade'];

export function getDeliveryReportFileName(reportId: string): string {
  return `${reportId}-entrega.pdf`;
}

function formatReportDate(value: string): string {
  return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

function formatDeadlineDate(value: string): string {
  return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
}

export function buildDeliveryReportTableBody(
  items: DeliveryReportPayloadDTO['items'],
): (string | number)[][] {
  return items.map((item) => [item.name, item.quantity, item.unit]);
}

function appendLine(doc: jsPDF, y: number, text: string): number {
  doc.text(text, 14, y);
  return y + 6;
}

export async function generateDeliveryReportPDF(
  payload: DeliveryReportPayloadDTO,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait' });
  let y = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(PDF_TITLE, 14, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y = appendLine(doc, y, `Lote: ${payload.report_id}`);
  y = appendLine(doc, y, `Pedido: ${payload.demand_supply_code}`);
  y = appendLine(doc, y, `Aprovado em: ${formatReportDate(payload.approved_at)}`);
  y = appendLine(doc, y, `Gerente: ${payload.approver.name}`);
  y += 4;

  doc.setFont('helvetica', 'bold');
  y = appendLine(doc, y, 'Requerente');
  doc.setFont('helvetica', 'normal');
  y = appendLine(doc, y, `Nome: ${payload.requester.name}`);

  if (payload.requester.sector) {
    y = appendLine(doc, y, `Setor: ${payload.requester.sector}`);
  }

  if (payload.requester.location) {
    y = appendLine(doc, y, `Filial: ${payload.requester.location}`);
  }

  y = appendLine(doc, y, `Destino: ${payload.destination}`);

  if (payload.locale) {
    y = appendLine(doc, y, `Local: ${payload.locale}`);
  }

  y = appendLine(doc, y, `Prazo de entrega: ${formatDeadlineDate(payload.delivery_deadline)}`);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [DELIVERY_REPORT_TABLE_HEAD],
    body: buildDeliveryReportTableBody(payload.items),
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? y;

  doc.text('Entregue por: _______________________', 14, finalY + 20);
  doc.text('Recebido por: _______________________', 14, finalY + 35);
  doc.text('Data: ____/____/________', 14, finalY + 50);

  doc.save(getDeliveryReportFileName(payload.report_id));
}
