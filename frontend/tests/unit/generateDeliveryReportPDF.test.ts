import type { DeliveryReportPayloadDTO } from '@ti-assistant/contracts';

const mockSave = jest.fn();
const mockText = jest.fn();
const mockSetFont = jest.fn();
const mockSetFontSize = jest.fn();
let autoTableOptions: { head: string[][]; body: (string | number)[][] } | undefined;

jest.mock('jspdf', () =>
  jest.fn().mockImplementation(() => ({
    setFont: mockSetFont,
    setFontSize: mockSetFontSize,
    text: mockText,
    save: mockSave,
    lastAutoTable: { finalY: 120 },
  })),
);

jest.mock('jspdf-autotable', () =>
  jest.fn((_doc, options) => {
    autoTableOptions = options;
  }),
);

import {
  buildDeliveryReportTableBody,
  DELIVERY_REPORT_TABLE_HEAD,
  generateDeliveryReportPDF,
  getDeliveryReportFileName,
} from '@/app/(dashboard)/supply-requests/admin/utils/generateDeliveryReportPDF';

const samplePayload: DeliveryReportPayloadDTO = {
  report_id: 'DS-0042-001',
  demand_supply_code: 'DS-0042',
  approved_at: '2026-06-18T10:00:00.000Z',
  approver: { name: 'Gerente Silva' },
  requester: {
    name: 'João Santos',
    sector: 'Manutenção',
    location: 'Filial SP',
  },
  destination: 'Obra Central',
  locale: 'Pátio 1',
  delivery_deadline: '2026-06-25T00:00:00.000Z',
  items: [
    { name: 'Cimento', quantity: 10, unit: 'sc' },
    { name: 'Areia', quantity: 5, unit: 'm³' },
    { name: 'Brita', quantity: 3, unit: 'm³' },
  ],
};

describe('generateDeliveryReportPDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    autoTableOptions = undefined;
  });

  describe('getDeliveryReportFileName', () => {
    it('builds download name from report id', () => {
      expect(getDeliveryReportFileName('DS-0042-001')).toBe('DS-0042-001-entrega.pdf');
    });
  });

  describe('buildDeliveryReportTableBody', () => {
    it('maps each item to name, quantity and unit columns', () => {
      expect(buildDeliveryReportTableBody(samplePayload.items)).toEqual([
        ['Cimento', 10, 'sc'],
        ['Areia', 5, 'm³'],
        ['Brita', 3, 'm³'],
      ]);
    });
  });

  describe('generateDeliveryReportPDF', () => {
    it('downloads PDF with report id filename', async () => {
      await generateDeliveryReportPDF(samplePayload);

      expect(mockSave).toHaveBeenCalledWith('DS-0042-001-entrega.pdf');
    });

    it('renders items table with correct head and row count', async () => {
      await generateDeliveryReportPDF(samplePayload);

      expect(autoTableOptions?.head).toEqual([DELIVERY_REPORT_TABLE_HEAD]);
      expect(autoTableOptions?.body).toHaveLength(3);
      expect(autoTableOptions?.body).toEqual([
        ['Cimento', 10, 'sc'],
        ['Areia', 5, 'm³'],
        ['Brita', 3, 'm³'],
      ]);
    });

    it('includes header, requester, destination and signature footer text', async () => {
      await generateDeliveryReportPDF(samplePayload);

      const renderedText = mockText.mock.calls.map(([text]) => text as string);

      expect(renderedText).toEqual(
        expect.arrayContaining([
          'Relatório de Entrega de Suprimentos',
          'Lote: DS-0042-001',
          'Pedido: DS-0042',
          'Gerente: Gerente Silva',
          'Requerente',
          'Nome: João Santos',
          'Setor: Manutenção',
          'Filial: Filial SP',
          'Destino: Obra Central',
          'Local: Pátio 1',
          'Entregue por: _______________________',
          'Recebido por: _______________________',
          'Data: ____/____/________',
        ]),
      );
      expect(renderedText.some((line) => line.startsWith('Aprovado em:'))).toBe(true);
      expect(renderedText.some((line) => line.startsWith('Prazo de entrega:'))).toBe(true);
    });
  });
});
