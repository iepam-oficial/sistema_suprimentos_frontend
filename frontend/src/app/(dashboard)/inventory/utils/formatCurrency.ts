import { formatBRL } from '@/utils/money';

function formatCurrency(value: number | string) {
    if (value === undefined || value === null || value === '') return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return formatBRL(num);
}

export default formatCurrency
