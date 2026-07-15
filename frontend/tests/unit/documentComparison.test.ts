import {
  compareDocuments,
  type DocumentComparisonInput,
} from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/services/DocumentComparison.service';

function baseInput(overrides: Partial<DocumentComparisonInput> = {}): DocumentComparisonInput {
  return {
    purchaseRequestItems: [
      { description: 'Parafuso sextavado M8', quantity: 10 },
      { description: 'Chave de fenda isolada', quantity: 5 },
    ],
    quoteProposal: {
      total_value: 805,
      freight: 50,
      taxes: 0,
      items: [
        {
          description: 'Parafuso sextavado M8',
          quantity: 10,
          unit_price: 25.5,
          total_price: 255,
        },
        {
          description: 'Chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
    },
    purchaseOrder: {
      supplier_name: 'Ferramentas ABC Ltda',
      items: [
        {
          description: 'Parafuso sextavado M8',
          quantity: 10,
          unit_price: 25.5,
          total_price: 255,
        },
        {
          description: 'Chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
    },
    invoiceLines: [
      {
        line_number: 1,
        description: 'Parafuso sextavado M8',
        quantity: 10,
        unit_price: 25.5,
        total_price: 255,
      },
      {
        line_number: 2,
        description: 'Chave de fenda isolada',
        quantity: 5,
        unit_price: 100,
        total_price: 500,
      },
    ],
    invoiceSupplierName: 'Ferramentas ABC Ltda',
    physicalLines: [
      { description: 'Parafuso sextavado M8', quantity_received: 10 },
      { description: 'Chave de fenda isolada', quantity_received: 5 },
    ],
    ...overrides,
  };
}

function hasDiscrepancy(
  discrepancies: ReturnType<typeof compareDocuments>,
  criteria: {
    severity: string;
    layer: string;
    field: string;
  },
): boolean {
  return discrepancies.some(
    (d) =>
      d.severity === criteria.severity &&
      d.layer === criteria.layer &&
      d.field === criteria.field,
  );
}

describe('compareDocuments', () => {
  it('returns empty when all documents match exactly', () => {
    const result = compareDocuments(baseInput());

    expect(result).toEqual([]);
  });

  it('returns only LOW when descriptions differ only in casing or spacing', () => {
    const input = baseInput({
      invoiceLines: [
        {
          line_number: 1,
          description: '  PARAFUSO SEXTAVADO M8  ',
          quantity: 10,
          unit_price: 25.5,
          total_price: 255,
        },
        {
          line_number: 2,
          description: 'chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
    });

    const result = compareDocuments(input);

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((d) => d.severity === 'LOW' && d.field === 'description')).toBe(true);
    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'SC', field: 'quantity' })).toBe(false);
    expect(hasDiscrepancy(result, { severity: 'MEDIUM', layer: 'QUOTE', field: 'unit_price' })).toBe(false);
  });

  it('flags HIGH quantity mismatch on SC layer', () => {
    const input = baseInput({
      invoiceLines: [
        {
          line_number: 1,
          description: 'Parafuso sextavado M8',
          quantity: 8,
          unit_price: 25.5,
          total_price: 204,
        },
        {
          line_number: 2,
          description: 'Chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'SC', field: 'quantity' })).toBe(true);
  });

  it('flags HIGH quantity mismatch on PO layer', () => {
    const input = baseInput({
      invoiceLines: [
        {
          line_number: 1,
          description: 'Parafuso sextavado M8',
          quantity: 12,
          unit_price: 25.5,
          total_price: 306,
        },
        {
          line_number: 2,
          description: 'Chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'PO', field: 'quantity' })).toBe(true);
  });

  it('flags MEDIUM price mismatch on QUOTE layer', () => {
    const input = baseInput({
      invoiceLines: [
        {
          line_number: 1,
          description: 'Parafuso sextavado M8',
          quantity: 10,
          unit_price: 30,
          total_price: 300,
        },
        {
          line_number: 2,
          description: 'Chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'MEDIUM', layer: 'QUOTE', field: 'unit_price' })).toBe(true);
  });

  it('flags CRITICAL supplier mismatch on PO layer', () => {
    const input = baseInput({
      invoiceSupplierName: 'Fornecedor Divergente SA',
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'CRITICAL', layer: 'PO', field: 'supplier_name' })).toBe(true);
    const supplierDisc = result.find((d) => d.field === 'supplier_name');
    expect(supplierDisc?.expected_value).toBe('Ferramentas ABC Ltda');
    expect(supplierDisc?.actual_value).toBe('Fornecedor Divergente SA');
  });

  it('flags CRITICAL unknown product on SC layer', () => {
    const input = baseInput({
      invoiceLines: [
        {
          line_number: 1,
          description: 'Parafuso sextavado M8',
          quantity: 10,
          unit_price: 25.5,
          total_price: 255,
        },
        {
          line_number: 2,
          description: 'Chave de fenda isolada',
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
        {
          line_number: 3,
          description: 'Produto não solicitado',
          quantity: 1,
          unit_price: 50,
          total_price: 50,
        },
      ],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'CRITICAL', layer: 'SC', field: 'product' })).toBe(true);
    const productDisc = result.find((d) => d.layer === 'SC' && d.field === 'product');
    expect(productDisc?.actual_value).toBe('Produto não solicitado');
  });

  it('flags HIGH quantity mismatch on PHYSICAL layer', () => {
    const input = baseInput({
      physicalLines: [{ description: 'Parafuso sextavado M8', quantity_received: 8 }],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'PHYSICAL', field: 'quantity' })).toBe(
      true,
    );
    const qtyDisc = result.find((d) => d.layer === 'PHYSICAL' && d.field === 'quantity');
    expect(qtyDisc?.expected_value).toBe('8');
    expect(qtyDisc?.actual_value).toBe('10');
  });

  it('flags CRITICAL unknown product on PHYSICAL layer', () => {
    const input = baseInput({
      physicalLines: [{ description: 'Produto não na NF', quantity_received: 1 }],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'CRITICAL', layer: 'PHYSICAL', field: 'product' })).toBe(
      true,
    );
  });

  it('returns only PHYSICAL divergence when NF matches PO but physical qty differs', () => {
    const input = baseInput({
      physicalLines: [{ description: 'Parafuso sextavado M8', quantity_received: 8 }],
    });

    const result = compareDocuments(input);

    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'PHYSICAL', field: 'quantity' })).toBe(
      true,
    );
    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'PO', field: 'quantity' })).toBe(false);
    expect(hasDiscrepancy(result, { severity: 'HIGH', layer: 'SC', field: 'quantity' })).toBe(false);
  });
});
