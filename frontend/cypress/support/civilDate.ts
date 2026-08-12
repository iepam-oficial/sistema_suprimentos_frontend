/**
 * Helpers de dia civil SP para asserts Cypress (espelho leve de src/utils/civilDate).
 * Mantidos no suporte E2E para não depender do alias @/ do app.
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const SP_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayLocalIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseCivilDateOnlyToIso(dateOnly: string): string {
  if (!DATE_ONLY.test(dateOnly)) {
    throw new Error(`esperado YYYY-MM-DD, recebido ${dateOnly}`);
  }
  return new Date(`${dateOnly}T00:00:00.000-03:00`).toISOString();
}

export function civilDateKeyFromIso(iso: string): string {
  return SP_FORMATTER.format(new Date(iso));
}

/** DD/MM/YYYY a partir de YYYY-MM-DD (dia civil). */
export function formatCivilDateBRFromKey(key: string): string {
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}
