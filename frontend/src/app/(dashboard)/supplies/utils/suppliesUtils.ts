import { Supply } from './types';

/** Máscara pt-BR para inputs de moeda (sem prefixo R$), ex.: 35,50 */
export function formatCurrencyBR(value: string | number): string {
  if (value === '' || value === null || value === undefined) return '';
  const number =
    typeof value === 'number'
      ? value
      : parseFloat(value.toString().replace(/\./g, '').replace(',', '.'));
  if (isNaN(number)) return '';
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrencyBR(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

function displayCurrencyFromApi(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    return formatCurrencyBR(value);
  }
  const s = String(value).trim();
  let n: number;
  if (s.includes(',')) {
    n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  } else {
    n = parseFloat(s);
  }
  if (isNaN(n)) return '';
  return formatCurrencyBR(n);
}

export const initializeFormData = (initialData?: Supply) => {
  if (initialData) {
    return {
      name: initialData.name || '',
      description: initialData.description || '',
      quantity: initialData.quantity || 0,
      minimum_quantity: initialData.minimum_quantity || 0,
      unit_id: initialData.unit?.id || '',
      category_id: initialData.category?.id || '',
      supplier_id: initialData.supplier?.id || '',
      image_url: initialData.image_url || '',
      unit_price: displayCurrencyFromApi((initialData as { unit_price?: unknown }).unit_price),
      chart_of_account_id:
        (initialData as { chartOfAccount?: { id?: string } }).chartOfAccount?.id || '',
    };
  }
  return {
    name: '',
    description: '',
    quantity: 0,
    minimum_quantity: 0,
    unit_id: '',
    category_id: '',
    supplier_id: '',
    image_url: '',
    unit_price: '',
    chart_of_account_id: '',
  };
};

type SupplyWithFreight = Supply & { freight?: number | string; subcategory_id?: string };

export function initializeFormDataWithFreight(initialData?: SupplyWithFreight) {
  const base = initializeFormData(initialData);
  return {
    ...base,
    freight:
      initialData?.freight !== undefined && initialData.freight !== null && initialData.freight !== ''
        ? displayCurrencyFromApi(initialData.freight)
        : '',
    subcategory_id: initialData?.subcategory_id ?? '',
  };
}
