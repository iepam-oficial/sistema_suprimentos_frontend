import { readFileSync } from 'fs';
import { join } from 'path';
import { AppError } from '../../../../sistema_suprimentos_backend/backend/src/domains/shared/errors/AppError';
import { parseNfeXml } from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/lib/NfeXmlParser';

const fixturePath = join(__dirname, '../fixtures/nfe-sample.xml');

describe('parseNfeXml', () => {
  it('parses fixture XML with multiple product lines', () => {
    const xml = readFileSync(fixturePath, 'utf-8');
    const result = parseNfeXml(xml);

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toEqual({
      line_number: 1,
      description: 'Parafuso sextavado M8',
      quantity: 10,
      unit_price: 25.5,
      total_price: 255,
    });
    expect(result.lines[1]).toEqual({
      line_number: 2,
      description: 'Chave de fenda isolada',
      quantity: 5,
      unit_price: 100,
      total_price: 500,
    });
  });

  it('extracts NF-e metadata (access key, number, series)', () => {
    const xml = readFileSync(fixturePath, 'utf-8');
    const result = parseNfeXml(xml);

    expect(result.nfe_access_key).toBe('35200114200166000187550010000000015123456789');
    expect(result.nfe_number).toBe('15');
    expect(result.nfe_series).toBe('1');
  });

  it('extracts supplier name from emit block', () => {
    const xml = readFileSync(fixturePath, 'utf-8');
    const result = parseNfeXml(xml);

    expect(result.supplier_name).toBe('Ferramentas ABC Ltda');
  });

  it('accepts Buffer input', () => {
    const buffer = readFileSync(fixturePath);
    const result = parseNfeXml(buffer);

    expect(result.lines).toHaveLength(2);
    expect(result.nfe_number).toBe('15');
  });

  it('throws AppError on invalid XML', () => {
    expect(() => parseNfeXml('<not-xml')).toThrow(AppError);
    expect(() => parseNfeXml('<not-xml')).toThrow('XML da NF-e inválido ou malformado');
  });

  it('throws AppError on empty XML', () => {
    expect(() => parseNfeXml('   ')).toThrow(AppError);
    expect(() => parseNfeXml('   ')).toThrow('XML da NF-e vazio');
  });

  it('throws AppError when infNFe structure is missing', () => {
    const xml = '<?xml version="1.0"?><root><foo>bar</foo></root>';
    expect(() => parseNfeXml(xml)).toThrow(AppError);
    expect(() => parseNfeXml(xml)).toThrow('infNFe não encontrado');
  });
});
