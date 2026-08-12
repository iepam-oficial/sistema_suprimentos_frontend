/**
 * Helpers de data civil (date-only) compartilhados por lotes e pedidos.
 *
 * O backend guarda datas civis como instantes; a referência é America/Sao_Paulo.
 * Exibir esses instantes em navegadores fora de -03:00 pode mostrar outro dia —
 * use civilDateKeyFromIso quando o dia civil precisar ser estável.
 */

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const SAO_PAULO_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD na data civil local do navegador (evita off-by-one de toISOString em UTC). */
export function todayLocalIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Interpreta YYYY-MM-DD como início do dia civil em America/Sao_Paulo → ISO para a API. */
export function parseCivilDateOnlyToIso(dateOnly: string): string {
  if (!DATE_ONLY_PATTERN.test(dateOnly)) {
    throw new Error(`Data inválida: esperado YYYY-MM-DD, recebido "${dateOnly}"`);
  }
  const date = new Date(`${dateOnly}T00:00:00.000-03:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data inválida: "${dateOnly}"`);
  }
  return date.toISOString();
}

/** YYYY-MM-DD do dia civil em America/Sao_Paulo para um ISO/instante. */
export function civilDateKeyFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Instante inválido: "${iso}"`);
  }
  return SAO_PAULO_DATE_FORMATTER.format(date);
}
