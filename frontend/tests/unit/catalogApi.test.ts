import { fetchSupplies, fetchSupplyById } from '@/features/catalog/api/catalogApi';
import { fetchSupplies as fetchRequesterSupplies } from '@/features/supply-requests/api/requestApi';

describe('catalogApi audience query', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchSupplies includes audience=requester when requested', async () => {
    await fetchSupplies('token', { audience: 'requester' });

    expect(global.fetch).toHaveBeenCalledWith('/api/supplies?audience=requester', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('fetchSupplyById includes audience=requester when requested', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'abc' }),
    }) as jest.Mock;

    await fetchSupplyById('token', 'abc', { audience: 'requester' });

    expect(global.fetch).toHaveBeenCalledWith('/api/supplies/abc?audience=requester', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('requestApi fetchSupplies defaults to audience=requester', async () => {
    await fetchRequesterSupplies('token');

    expect(global.fetch).toHaveBeenCalledWith('/api/supplies?audience=requester', {
      headers: { Authorization: 'Bearer token' },
    });
  });
});
