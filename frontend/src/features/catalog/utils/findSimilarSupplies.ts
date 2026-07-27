import { searchSupplies } from '@/features/catalog/api/catalogApi';
import type { SupplyDTO } from '@/features/catalog/types';

export async function findSimilarSupplies(
  token: string,
  name: string,
): Promise<SupplyDTO[]> {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return [];
  }

  try {
    return await searchSupplies(token, name, { includeHidden: true });
  } catch (error) {
    console.error('findSimilarSupplies: search failed', error);
    return [];
  }
}
