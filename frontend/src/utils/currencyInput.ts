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

/** Sanitiza digitação de moeda sem forçar casas decimais a cada tecla */
export function sanitizeCurrencyInput(value: string): string {
  const cleaned = value.replace(/[^\d,]/g, '');
  const commaIndex = cleaned.indexOf(',');
  if (commaIndex === -1) return cleaned;
  const intPart = cleaned.slice(0, commaIndex);
  const decPart = cleaned.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2);
  return decPart.length > 0 || cleaned.endsWith(',') ? `${intPart},${decPart}` : intPart;
}

export function parseCurrencyBR(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}
