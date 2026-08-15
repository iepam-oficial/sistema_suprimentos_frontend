import { buildPdfExportTable } from '@/features/reports/reportPdfColumns';

describe('buildPdfExportTable', () => {
  it('filters supplies-stock to essential summary columns only (no detail/lote)', () => {
    const result = buildPdfExportTable({
      slug: 'supplies-stock',
      columnKeys: [
        'name',
        'balance',
        'minimum_quantity',
        'status',
        'stock_value',
        'extra',
      ],
      tableHeaders: ['Nome', 'Saldo', 'Mín', 'Status', 'Valor', 'Extra'],
      tableRows: [['Item A', 10, 2, 'ok', 100, 'x']],
      detailColumnKeys: ['batch', 'qty'],
      detailHeaders: ['Lote', 'Qtd'],
      rowDetails: [{ headers: ['Lote', 'Qtd'], rows: [['L1', 5]] }],
    });

    expect(result).toEqual({
      headers: ['Nome', 'Saldo', 'Mín', 'Status', 'Valor'],
      rows: [['Item A', 10, 2, 'ok', 100]],
    });
  });

  it('filters inventory-overview to essential preset keys', () => {
    const result = buildPdfExportTable({
      slug: 'inventory-overview',
      columnKeys: [
        'name',
        'serial_number',
        'location',
        'category',
        'status',
        'acquisition_price',
        'notes',
      ],
      tableHeaders: [
        'Nome',
        'Série',
        'Local',
        'Categoria',
        'Status',
        'Preço',
        'Notas',
      ],
      tableRows: [['PC', 'SN1', 'Sala', 'TI', 'ativo', 1500, 'obs']],
    });

    expect(result).toEqual({
      headers: ['Nome', 'Série', 'Local', 'Categoria', 'Status', 'Preço'],
      rows: [['PC', 'SN1', 'Sala', 'TI', 'ativo', 1500]],
    });
  });

  it('slices other slugs to the first 6 columns', () => {
    const result = buildPdfExportTable({
      slug: 'consumption-by-sector',
      tableHeaders: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      tableRows: [[1, 2, 3, 4, 5, 6, 7]],
    });

    expect(result).toEqual({
      headers: ['A', 'B', 'C', 'D', 'E', 'F'],
      rows: [[1, 2, 3, 4, 5, 6]],
    });
  });

  it('keeps all columns when other slugs have 6 or fewer', () => {
    const result = buildPdfExportTable({
      slug: 'alerts',
      tableHeaders: ['Nível', 'Qtd'],
      tableRows: [['Alto', 3]],
    });

    expect(result).toEqual({
      headers: ['Nível', 'Qtd'],
      rows: [['Alto', 3]],
    });
  });
});
