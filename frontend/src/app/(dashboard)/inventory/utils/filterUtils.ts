import { normalizeInternalCodeForSearch } from '@/utils/internalCode';
import { InventoryItem } from '../types';

export const filterItems = (
    items: InventoryItem[],
    searchTerm: string,
    selectedCategory: string,
    selectedSubcategory: string
): InventoryItem[] => {
    return Array.isArray(items) ? items.filter(item => {
        const normalizedSearchForCode = normalizeInternalCodeForSearch(searchTerm).toLowerCase();
        const matchesInternalCode = normalizedSearchForCode.length > 0 &&
            normalizeInternalCodeForSearch(item.internal_code ?? '').toLowerCase().includes(normalizedSearchForCode);
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            matchesInternalCode;

        const matchesCategory = !selectedCategory || item.category?.id === selectedCategory;
        const matchesSubcategory = !selectedSubcategory || item.subcategory?.id === selectedSubcategory;

        return matchesSearch && matchesCategory && matchesSubcategory;
    }) : [];
}; 