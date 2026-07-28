import { InventoryItem } from '../types';

export const filterItems = (
    items: InventoryItem[],
    searchTerm: string,
    selectedCategory: string,
    selectedSubcategory: string
): InventoryItem[] => {
    return Array.isArray(items) ? items.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.internal_code ?? '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !selectedCategory || item.category?.id === selectedCategory;
        const matchesSubcategory = !selectedSubcategory || item.subcategory?.id === selectedSubcategory;

        return matchesSearch && matchesCategory && matchesSubcategory;
    }) : [];
}; 