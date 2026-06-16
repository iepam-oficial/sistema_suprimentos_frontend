import { Supply } from './types';

export const filterSupplies = (
    supplies: Supply[],
    searchTerm: string,
    selectedCategory: string
): Supply[] => {
    return Array.isArray(supplies) ? supplies.filter(supply => {
        const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supply.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !selectedCategory || supply.category?.id === selectedCategory;

        return matchesSearch && matchesCategory;
    }) : [];
};

export const getSuppliesBelowMinimum = (supplies: Supply[]): Supply[] => {
    return supplies.filter(supply => supply.quantity < supply.minimum_quantity);
}; 