export const BRAZIL_UFS: readonly string[] = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
];

export const CEST_UF_NATIONAL_FILTER = 'NACIONAL';

export const CEST_UF_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos' },
  { value: CEST_UF_NATIONAL_FILTER, label: 'Nacional' },
  ...BRAZIL_UFS.map((uf) => ({ value: uf, label: uf })),
];

export function formatCestUfLabel(ufs: string[] | undefined | null): string {
  if (ufs == null || ufs.length === 0) return 'Nacional';
  return [...new Set(ufs)].sort().join(', ');
}

/** Formata CEST de 7 dígitos como 12.345.67 */
export function formatCestDisplay(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 7) return code;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 7)}`;
}

/** Terceira linha do autocomplete/drawer: `09.001.00 · SP, RJ; 10.001.00 · Nacional`. Sem CEST → null. */
export function formatNcmCestUfHint(
  cests: Array<{ code: string; ufs?: string[] }> | undefined | null,
): string | null {
  if (cests == null || cests.length === 0) return null;
  return cests
    .map((cest) => `${formatCestDisplay(cest.code)} · ${formatCestUfLabel(cest.ufs)}`)
    .join('; ');
}

export function formatNcmRowUfColumn(
  cests: Array<{ ufs?: string[] }> | undefined | null,
): string {
  if (cests == null || cests.length === 0) return '-';

  const union = new Set<string>();
  let hasNacional = false;

  for (const cest of cests) {
    if (cest.ufs == null || cest.ufs.length === 0) {
      hasNacional = true;
      continue;
    }
    for (const uf of cest.ufs) {
      union.add(uf);
    }
  }

  const siglas = [...union].sort();
  if (hasNacional) {
    return ['Nacional', ...siglas].join(', ');
  }
  return siglas.join(', ');
}
