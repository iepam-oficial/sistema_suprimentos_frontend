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

  it.each([
    {
      slug: 'supply-requests',
      columnKeys: [
        'id',
        'status',
        'status_code',
        'created_at',
        'delivery_deadline',
        'requester',
        'sector',
        'supply_name',
        'quantity',
        'notes',
      ],
      tableHeaders: [
        'ID',
        'Status',
        'Código',
        'Criada em',
        'Prazo',
        'Solicitante',
        'Setor',
        'Suprimento',
        'Qtd',
        'Obs',
      ],
      tableRows: [
        [
          'r1',
          'Pendente',
          'PENDING',
          '2026-01-01',
          '2026-01-10',
          'Ana',
          'TI',
          'Papel',
          5,
          'x',
        ],
      ],
      expectedHeaders: [
        'ID',
        'Status',
        'Criada em',
        'Solicitante',
        'Suprimento',
        'Qtd',
      ],
      expectedRows: [['r1', 'Pendente', '2026-01-01', 'Ana', 'Papel', 5]],
    },
    {
      slug: 'consumption-by-sector',
      columnKeys: [
        'id',
        'created_at',
        'sector',
        'supply_code',
        'supply_name',
        'category',
        'quantity',
        'unit_cost',
        'notes',
      ],
      tableHeaders: [
        'ID',
        'Data',
        'Setor',
        'Cód.',
        'Suprimento',
        'Cat.',
        'Qtd',
        'Custo',
        'Obs',
      ],
      tableRows: [
        ['m1', '2026-02-01', 'TI', 'S1', 'Toner', 'Informática', 2, 10, 'x'],
      ],
      expectedHeaders: ['ID', 'Data', 'Setor', 'Suprimento', 'Qtd', 'Custo'],
      expectedRows: [['m1', '2026-02-01', 'TI', 'Toner', 2, 10]],
    },
    {
      slug: 'purchases-by-batch',
      columnKeys: [
        'id',
        'purchased_at',
        'supplier',
        'supply_code',
        'supply_name',
        'purchased_quantity',
        'unit_price',
        'total_price',
        'notes',
      ],
      tableHeaders: [
        'ID',
        'Compra em',
        'Fornecedor',
        'Cód.',
        'Suprimento',
        'Qtd',
        'Unit.',
        'Total',
        'Obs',
      ],
      tableRows: [
        [
          'b1',
          '2026-03-01',
          'ACME',
          'S1',
          'Caneta',
          100,
          1.5,
          150,
          'x',
        ],
      ],
      expectedHeaders: [
        'ID',
        'Compra em',
        'Fornecedor',
        'Suprimento',
        'Qtd',
        'Total',
      ],
      expectedRows: [['b1', '2026-03-01', 'ACME', 'Caneta', 100, 150]],
    },
    {
      slug: 'service-orders',
      columnKeys: [
        'id',
        'order_number',
        'month',
        'entry_date',
        'exit_date',
        'client_name',
        'equipment_description',
        'supplier',
        'total_price',
        'notes',
      ],
      tableHeaders: [
        'ID',
        'Nº OS',
        'Mês',
        'Entrada',
        'Saída',
        'Cliente',
        'Equipamento',
        'Fornecedor',
        'Custo',
        'Obs',
      ],
      tableRows: [
        [
          'o1',
          'OS-1',
          '2026-04',
          '2026-04-01',
          '2026-04-05',
          'Cliente',
          'Notebook',
          'Tech',
          200,
          'x',
        ],
      ],
      expectedHeaders: [
        'ID',
        'Nº OS',
        'Mês',
        'Entrada',
        'Equipamento',
        'Custo',
      ],
      expectedRows: [['o1', 'OS-1', '2026-04', '2026-04-01', 'Notebook', 200]],
    },
    {
      slug: 'alerts-by-level',
      columnKeys: [
        'id',
        'level',
        'about',
        'description',
        'created_at',
        'inventory_code',
        'inventory_name',
        'location',
        'sector',
      ],
      tableHeaders: [
        'ID',
        'Nível',
        'Assunto',
        'Descrição',
        'Criado em',
        'Cód.',
        'Inventário',
        'Local',
        'Setor',
      ],
      tableRows: [
        [
          'a1',
          'Alto',
          'Garantia',
          'Detalhe longo',
          '2026-05-01',
          'INV-1',
          'Monitor',
          'Sala 1',
          'TI',
        ],
      ],
      expectedHeaders: [
        'ID',
        'Nível',
        'Assunto',
        'Criado em',
        'Inventário',
        'Local',
      ],
      expectedRows: [
        ['a1', 'Alto', 'Garantia', '2026-05-01', 'Monitor', 'Sala 1'],
      ],
    },
  ])(
    'filters $slug to a lean PDF preset fewer than full Excel columns',
    ({
      slug,
      columnKeys,
      tableHeaders,
      tableRows,
      expectedHeaders,
      expectedRows,
    }) => {
      const result = buildPdfExportTable({
        slug,
        columnKeys,
        tableHeaders,
        tableRows,
      });

      expect(result.headers).toEqual(expectedHeaders);
      expect(result.rows).toEqual(expectedRows);
      expect(result.headers.length).toBeLessThan(columnKeys.length);
      expect(result.headers.length).toBeLessThanOrEqual(6);
    },
  );

  it('slices unknown slugs without columnKeys to the first 6 columns', () => {
    const result = buildPdfExportTable({
      slug: 'legacy-report',
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

  it('falls back to first 6 columns when enriched slug has no columnKeys', () => {
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
});
