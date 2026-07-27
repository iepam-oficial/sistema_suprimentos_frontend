jest.mock('@/features/catalog/api/catalogApi', () => ({
  searchSupplies: jest.fn(),
}));

import { searchSupplies } from '@/features/catalog/api/catalogApi';
import type { SupplyDTO } from '@/features/catalog/types';
import { findSimilarSupplies } from '@/features/catalog/utils/findSimilarSupplies';

const mockSearchSupplies = searchSupplies as jest.MockedFunction<typeof searchSupplies>;

function createSupply(id: string, name: string): SupplyDTO {
  return {
    id,
    name,
    available_quantity: 10,
    minimum_quantity: 0,
    visible_to_requesters: true,
    unit: { id: 'u1', name: 'Unidade', symbol: 'un' },
  } as SupplyDTO;
}

describe('findSimilarSupplies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns [] for short input without calling searchSupplies', async () => {
    const result = await findSimilarSupplies('token', ' a ');

    expect(result).toEqual([]);
    expect(mockSearchSupplies).not.toHaveBeenCalled();
  });

  it('returns search results on success', async () => {
    const supplies = [createSupply('1', 'Papel A4'), createSupply('2', 'Papel A3')];
    mockSearchSupplies.mockResolvedValue(supplies);

    const result = await findSimilarSupplies('token', '  papel  ');

    expect(mockSearchSupplies).toHaveBeenCalledWith('token', '  papel  ', { includeHidden: true });
    expect(result).toEqual(supplies);
  });

  it('returns [] on search failure without throwing', async () => {
    mockSearchSupplies.mockRejectedValue(new Error('Erro ao buscar suprimentos'));

    await expect(findSimilarSupplies('token', 'papel')).resolves.toEqual([]);
  });
});
