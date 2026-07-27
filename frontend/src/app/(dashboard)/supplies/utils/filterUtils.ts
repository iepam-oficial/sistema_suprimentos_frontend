import { Supply } from './types';

export type SupplyVisibilityFilter = '' | 'visible' | 'hidden';

export const filterSupplies = (
    supplies: Supply[],
    searchTerm: string,
    selectedCategory: string,
    visibility: SupplyVisibilityFilter = ''
): Supply[] => {
    return Array.isArray(supplies) ? supplies.filter(supply => {
        const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supply.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supply.internal_code ?? '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !selectedCategory || supply.category?.id === selectedCategory;

        const matchesVisibility =
            visibility === '' ||
            (visibility === 'visible' && supply.visible_to_requesters === true) ||
            (visibility === 'hidden' && supply.visible_to_requesters === false);

        return matchesSearch && matchesCategory && matchesVisibility;
    }) : [];
};

export const getSuppliesBelowMinimum = (supplies: Supply[]): Supply[] => {
    return supplies.filter(supply => supply.available_quantity < supply.minimum_quantity);
}; 