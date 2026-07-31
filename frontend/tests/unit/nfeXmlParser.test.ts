import { readFileSync } from 'fs';
import { join } from 'path';
import { AppError } from '../../../../sistema_suprimentos_backend/backend/src/domains/shared/errors/AppError';
import { parseNfeXml } from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/lib/NfeXmlParser';

const fixturePath = join(__dirname, '../fixtures/nfe-sample.xml');

const NULL_REFORM = {
  ibs_value: null,
  cbs_value: null,
  is_value: null,
} as const;

describe('parseNfeXml', () => {
  it('parses fixture XML with multiple product lines and fiscal snapshot', () => {
    const xml = readFileSync(fixturePath, 'utf-8');
    const result = parseNfeXml(xml);

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toEqual({
      line_number: 1,
      description: 'Parafuso sextavado M8',
      quantity: 10,
      unit_price: 25.5,
      total_price: 255,
      ncm: '73181500',
      commercial_unit: 'UN',
      cfop: '5102',
      discount_value: 5,
      cst: '00',
      icms_base: 250,
      icms_value: 45,
      icms_rate: 18,
      icms_st_base: null,
      icms_st_value: null,
      ipi_value: 12.75,
      ipi_rate: 5,
      ...NULL_REFORM,
    });
    expect(result.lines[1]).toEqual({
      line_number: 2,
      description: 'Chave de fenda isolada',
      quantity: 5,
      unit_price: 100,
      total_price: 500,
      ncm: '82054000',
      commercial_unit: 'PC',
      cfop: '5405',
      discount_value: null,
      cst: '10',
      icms_base: 500,
      icms_value: 60,
      icms_rate: 12,
      icms_st_base: 550,
      icms_st_value: 66,
      ipi_value: null,
      ipi_rate: null,
      ...NULL_REFORM,
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

  it('parses lines without NCM when prod.NCM is absent', () => {
    const xml = readFileSync(fixturePath, 'utf-8').replace(/<NCM>[^<]*<\/NCM>\s*/g, '');
    const result = parseNfeXml(xml);

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).not.toHaveProperty('ncm');
    expect(result.lines[1]).not.toHaveProperty('ncm');
    expect(result.lines[0].description).toBe('Parafuso sextavado M8');
    expect(result.lines[1].description).toBe('Chave de fenda isolada');
    expect(result.lines[0].commercial_unit).toBe('UN');
    expect(result.lines[0].cfop).toBe('5102');
  });

  it('returns null fiscal fields when imposto/commercial tags are absent', () => {
    const xml = `<?xml version="1.0"?>
      <NFe>
        <infNFe Id="NFe35200114200166000187550010000000015123456789">
          <ide><nNF>1</nNF><serie>1</serie></ide>
          <det nItem="1">
            <prod>
              <xProd>Item sem imposto</xProd>
              <qCom>1</qCom>
              <vUnCom>10</vUnCom>
              <vProd>10</vProd>
            </prod>
          </det>
        </infNFe>
      </NFe>`;

    const result = parseNfeXml(xml);
    expect(result.lines[0]).toMatchObject({
      commercial_unit: null,
      cfop: null,
      discount_value: null,
      cst: null,
      icms_base: null,
      icms_value: null,
      icms_rate: null,
      icms_st_base: null,
      icms_st_value: null,
      ipi_value: null,
      ipi_rate: null,
      ...NULL_REFORM,
    });
  });
});
