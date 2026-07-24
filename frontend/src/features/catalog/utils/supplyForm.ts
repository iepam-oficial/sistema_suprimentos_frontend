import type { Supply } from '@/features/catalog/types';

export const initializeFormData = (initialData?: Supply) => {
  if (initialData) {
    return {
      name: initialData.name || '',
      description: initialData.description || '',
      minimum_quantity: initialData.minimum_quantity || 0,
      unit_id: initialData.unit?.id || initialData.unit_id || '',
      category_id: initialData.category?.id || initialData.category_id || '',
      subcategory_id: initialData.subcategory_id ?? '',
      image_url: initialData.image_url || '',
      chart_of_account_id: initialData.chart_of_account_id || '',
    };
  }
  return {
    name: '',
    description: '',
    minimum_quantity: 0,
    unit_id: '',
    category_id: '',
    subcategory_id: '',
    image_url: '',
    chart_of_account_id: '',
  };
};

/** @deprecated Use initializeFormData */
export function initializeFormDataWithFreight(initialData?: Supply) {
  return initializeFormData(initialData);
}
