import { AppError } from '../../../../sistema_suprimentos_backend/backend/src/domains/shared/errors/AppError';
import {
  parseAiExtractionContent,
  OpenAiExtractionAdapter,
} from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/adapters/OpenAiExtractionAdapter';
import { LoggingAiExtractionAdapter } from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/adapters/LoggingAiExtractionAdapter';
import {
  DEFAULT_AI_CONFIDENCE_THRESHOLD,
  filterByThreshold,
} from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/lib/aiThreshold';
import type { AiExtractionResult } from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/ports/AiExtractionPort';

describe('filterByThreshold', () => {
  const sampleResult: AiExtractionResult = {
    fields: {
      invoice_number: { value: '12345', confidence: 0.95 },
      total_amount: { value: 1500.5, confidence: 0.8 },
      supplier_name: { value: 'ACME Ltda', confidence: 0.74 },
      issue_date: { value: '2026-06-01', confidence: 0.75 },
      notes: { value: 'urgent', confidence: 0.5 },
    },
  };

  it('uses default threshold 0.75', () => {
    expect(DEFAULT_AI_CONFIDENCE_THRESHOLD).toBe(0.75);
    const filtered = filterByThreshold(sampleResult);

    expect(filtered).toEqual({
      invoice_number: '12345',
      total_amount: 1500.5,
      issue_date: '2026-06-01',
    });
    expect(filtered).not.toHaveProperty('supplier_name');
    expect(filtered).not.toHaveProperty('notes');
  });

  it('includes fields exactly at the threshold', () => {
    const filtered = filterByThreshold(sampleResult, 0.75);
    expect(filtered.issue_date).toBe('2026-06-01');
  });

  it('omits fields below a custom threshold', () => {
    const filtered = filterByThreshold(sampleResult, 0.9);
    expect(filtered).toEqual({
      invoice_number: '12345',
    });
  });

  it('returns values only without confidence metadata', () => {
    const filtered = filterByThreshold(sampleResult);
    for (const value of Object.values(filtered)) {
      expect(value).not.toEqual(expect.objectContaining({ confidence: expect.any(Number) }));
    }
  });

  it('returns empty object when no field meets threshold', () => {
    const filtered = filterByThreshold(sampleResult, 1);
    expect(filtered).toEqual({});
  });

  it('returns empty object for empty extraction result', () => {
    expect(filterByThreshold({ fields: {} })).toEqual({});
  });
});

describe('parseAiExtractionContent', () => {
  it('parses valid JSON extraction payload', () => {
    const content = JSON.stringify({
      fields: {
        invoice_number: { value: 'NF-100', confidence: 0.92 },
        total: { value: 99.9, confidence: 0.61 },
      },
    });

    expect(parseAiExtractionContent(content)).toEqual({
      fields: {
        invoice_number: { value: 'NF-100', confidence: 0.92 },
        total: { value: 99.9, confidence: 0.61 },
      },
    });
  });

  it('parses JSON wrapped in markdown code fences', () => {
    const content = '```json\n{"fields":{"sku":{"value":"ABC","confidence":0.88}}}\n```';
    expect(parseAiExtractionContent(content)).toEqual({
      fields: {
        sku: { value: 'ABC', confidence: 0.88 },
      },
    });
  });

  it('throws AppError when JSON is malformed', () => {
    expect(() => parseAiExtractionContent('not-json')).toThrow(AppError);
    expect(() => parseAiExtractionContent('not-json')).toThrow('JSON malformado');
  });

  it('throws AppError when fields are missing or invalid', () => {
    expect(() => parseAiExtractionContent('{"items":[]}'))
      .toThrow('campo "fields" ausente');

    expect(() =>
      parseAiExtractionContent(
        JSON.stringify({
          fields: {
            broken: { value: 'x', confidence: 1.2 },
          },
        }),
      ),
    ).toThrow('campo "broken" sem confidence válido');
  });
});

describe('OpenAiExtractionAdapter', () => {
  it('throws AppError when API key is missing', async () => {
    const adapter = new OpenAiExtractionAdapter({ apiKey: '' });
    const fetchMock = jest.fn();
    const adapterWithFetch = new OpenAiExtractionAdapter({ apiKey: '', fetchFn: fetchMock });

    await expect(adapter.extractFromPdf(Buffer.from('pdf'), 'nf')).rejects.toThrow(AppError);
    await expect(adapter.extractFromPdf(Buffer.from('pdf'), 'nf')).rejects.toThrow('OPENAI_API_KEY');
    await expect(adapterWithFetch.extractFromImage(Buffer.from('img'), 'nf')).rejects.toThrow(
      AppError,
    );
    await expect(adapterWithFetch.extractFromImage(Buffer.from('img'), 'nf')).rejects.toThrow(
      'OPENAI_API_KEY',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('LoggingAiExtractionAdapter', () => {
  it('returns empty fields without calling external APIs', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const adapter = new LoggingAiExtractionAdapter();

    await expect(adapter.extractFromPdf(Buffer.from('pdf'), 'ctx')).resolves.toEqual({ fields: {} });
    await expect(adapter.extractFromImage(Buffer.from('img'))).resolves.toEqual({ fields: {} });
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });
});
