import { matchesAbcFilter, type AbcFilterValue } from '@/features/catalog/abcClassification';
import { normalizeInternalCodeForSearch } from '@/utils/internalCode';
import { Supply } from './types';

export type SupplyVisibilityFilter = '' | 'visible' | 'hidden';
export type { AbcFilterValue as SupplyAbcFilter };

export const filterSupplies = (
    supplies: Supply[],
    searchTerm: string,
    selectedCategory: string,
    visibility: SupplyVisibilityFilter = '',
    abcClassification: AbcFilterValue = ''
): Supply[] => {
    return Array.isArray(supplies) ? supplies.filter(supply => {
        const normalizedSearchForCode = normalizeInternalCodeForSearch(searchTerm).toLowerCase();
        const matchesInternalCode = normalizedSearchForCode.length > 0 &&
            normalizeInternalCodeForSearch(supply.internal_code ?? '').toLowerCase().includes(normalizedSearchForCode);
        const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supply.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            matchesInternalCode;

        const matchesCategory = !selectedCategory || supply.category?.id === selectedCategory;

        const matchesVisibility =
            visibility === '' ||
            (visibility === 'visible' && supply.visible_to_requesters === true) ||
            (visibility === 'hidden' && supply.visible_to_requesters === false);

        const matchesAbc = matchesAbcFilter(supply.abc_classification, abcClassification);

        return matchesSearch && matchesCategory && matchesVisibility && matchesAbc;
    }) : [];
};

export const getSuppliesBelowMinimum = (supplies: Supply[]): Supply[] => {
    return supplies.filter(supply => supply.available_quantity < supply.minimum_quantity);
}; 