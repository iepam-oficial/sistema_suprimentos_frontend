import { AppError } from '../../../../sistema_suprimentos_backend/backend/src/domains/shared/errors/AppError';
import {
  normalizeExtractionFields,
  parseAiExtractionContent,
  OpenAiExtractionAdapter,
} from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/adapters/OpenAiExtractionAdapter';
import { normalizeProposalPdfSuggestions } from '../../../../sistema_suprimentos_backend/backend/src/domains/procurement/mappers/procurement-quote.mapper';
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

  it('throws AppError when fields are missing', () => {
    expect(() => parseAiExtractionContent('{"items":[]}'))
      .toThrow('campo "fields" ausente');
  });

  it('clamps confidence above 1.0 when value is present', () => {
    expect(
      parseAiExtractionContent(
        JSON.stringify({
          fields: {
            broken: { value: 'x', confidence: 1.2 },
          },
        }),
      ),
    ).toEqual({
      fields: {
        broken: { value: 'x', confidence: 1 },
      },
    });
  });

  it('normalizes loose scalar fields using sibling average confidence', () => {
    expect(
      parseAiExtractionContent(
        JSON.stringify({
          fields: {
            total_value: { value: 4896, confidence: 0.9 },
            delivery_days: { value: 7, confidence: 0.8 },
            payment_days: { value: 30, confidence: 0.7 },
            freight: 120,
          },
        }),
      ),
    ).toEqual({
      fields: {
        total_value: { value: 4896, confidence: 0.9 },
        delivery_days: { value: 7, confidence: 0.8 },
        payment_days: { value: 30, confidence: 0.7 },
        freight: { value: 120, confidence: 0.8 },
      },
    });
  });

  it('normalizes loose items array using sibling average confidence', () => {
    const items = [
      {
        description: 'Teclado USB OfficeEasy Preto Maxprint',
        quantity: 1,
        unit_price: 175,
        total_price: 175,
      },
    ];

    const parsed = parseAiExtractionContent(
      JSON.stringify({
        fields: {
          total_value: { value: 4896, confidence: 0.9 },
          delivery_days: { value: 7, confidence: 0.8 },
          payment_days: { value: 30, confidence: 0.7 },
          items,
        },
      }),
    );

    expect(parsed.fields.items).toEqual({
      value: items,
      confidence: 0.8,
    });
  });

  it('parses real-world proposal payload and filters by threshold', () => {
    const items = [
      {
        description: 'Teclado USB OfficeEasy Preto Maxprint',
        quantity: 1,
        unit_price: 175,
        total_price: 175,
      },
    ];

    const parsed = parseAiExtractionContent(
      JSON.stringify({
        fields: {
          total_value: { value: 4896, confidence: 0.9 },
          delivery_days: { value: 7, confidence: 0.8 },
          payment_days: { value: 30, confidence: 0.7 },
          items,
        },
      }),
    );

    const filtered = filterByThreshold(parsed);
    const suggestions = normalizeProposalPdfSuggestions(filtered);

    expect(filtered).toMatchObject({
      total_value: 4896,
      delivery_days: 7,
      items,
    });
    expect(filtered).not.toHaveProperty('payment_days');
    expect(suggestions.items).toHaveLength(1);
    expect(suggestions.total_value).toBe(4896);
  });

  it('uses default threshold when normalizing fields without valid siblings', () => {
    expect(
      normalizeExtractionFields({
        items: [{ description: 'Item', quantity: 1, unit_price: 10, total_price: 10 }],
      }),
    ).toEqual({
      items: {
        value: [{ description: 'Item', quantity: 1, unit_price: 10, total_price: 10 }],
        confidence: DEFAULT_AI_CONFIDENCE_THRESHOLD,
      },
    });
  });
});

describe('OpenAiExtractionAdapter', () => {
  const originalAiModel = process.env.AI_MODEL;

  afterEach(() => {
    if (originalAiModel === undefined) {
      delete process.env.AI_MODEL;
    } else {
      process.env.AI_MODEL = originalAiModel;
    }
  });

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

  it('extracts from PDF via Files API and Chat Completions', async () => {
    delete process.env.AI_MODEL;

    const extractionPayload = {
      fields: {
        total_value: { value: 1500, confidence: 0.9 },
      },
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'file-test' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(extractionPayload) } }],
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const adapter = new OpenAiExtractionAdapter({
      apiKey: 'test-key',
      fetchFn: fetchMock,
    });

    const result = await adapter.extractFromPdf(Buffer.from('%PDF-1.4'), 'proposal ctx');

    expect(result).toEqual(extractionPayload);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [uploadUrl, uploadInit] = fetchMock.mock.calls[0];
    expect(uploadUrl).toBe('https://api.openai.com/v1/files');
    expect(uploadInit?.method).toBe('POST');
    expect(uploadInit?.headers).toEqual({ Authorization: 'Bearer test-key' });
    expect(uploadInit?.body).toBeInstanceOf(FormData);

    const [chatUrl, chatInit] = fetchMock.mock.calls[1];
    expect(chatUrl).toBe('https://api.openai.com/v1/chat/completions');
    const chatBody = JSON.parse(String(chatInit?.body));
    expect(chatBody.model).toBe('gpt-4o');
    expect(chatBody.messages[1].content).toEqual(
      expect.arrayContaining([
        { type: 'file', file: { file_id: 'file-test' } },
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('proposal ctx'),
        }),
      ]),
    );

    const [deleteUrl, deleteInit] = fetchMock.mock.calls[2];
    expect(deleteUrl).toBe('https://api.openai.com/v1/files/file-test');
    expect(deleteInit?.method).toBe('DELETE');
  });

  it('does not call chat or delete when PDF upload fails', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'invalid pdf',
    });

    const adapter = new OpenAiExtractionAdapter({
      apiKey: 'test-key',
      fetchFn: fetchMock,
    });

    await expect(adapter.extractFromPdf(Buffer.from('bad'), 'ctx')).rejects.toThrow(AppError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deletes uploaded file when chat completion fails', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'file-test' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'server error',
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const adapter = new OpenAiExtractionAdapter({
      apiKey: 'test-key',
      fetchFn: fetchMock,
    });

    await expect(adapter.extractFromPdf(Buffer.from('%PDF'), 'ctx')).rejects.toThrow(AppError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toBe('https://api.openai.com/v1/files/file-test');
  });

  it('returns extraction result when file delete fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const extractionPayload = {
      fields: {
        invoice_number: { value: 'NF-1', confidence: 0.95 },
      },
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'file-test' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(extractionPayload) } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'delete failed',
      });

    const adapter = new OpenAiExtractionAdapter({
      apiKey: 'test-key',
      fetchFn: fetchMock,
    });

    await expect(adapter.extractFromPdf(Buffer.from('%PDF'), 'ctx')).resolves.toEqual(
      extractionPayload,
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
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
