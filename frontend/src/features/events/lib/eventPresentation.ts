import type { Event, EventStatus, EventType } from '../types';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const EVENT_STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'REUNIAO', label: 'Reunião' },
  { value: 'AULA', label: 'Aula' },
  { value: 'FESTA', label: 'Festa' },
  { value: 'FORMATURA', label: 'Formatura' },
  { value: 'FEIRA_TECNOLOGICA', label: 'Feira tecnológica' },
  { value: 'ALUGUEL_SALA', label: 'Aluguel de sala' },
  { value: 'OUTRO', label: 'Outro' },
];

export function getEventStatusLabel(status: EventStatus): string {
  return EVENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function getEventStatusBorderColor(status: EventStatus): string {
  switch (status) {
    case 'AGENDADO':
      return '#2563eb';
    case 'EM_ANDAMENTO':
      return '#f59e0b';
    case 'CONCLUIDO':
      return '#10b981';
    case 'CANCELADO':
      return '#94a3b8';
    default:
      return '#6b7280';
  }
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateBr(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatTimeBr(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatSelectedDateLabel(date: Date): string {
  return formatDateBr(date);
}

export function getWeekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function parseEventDate(iso: string): Date {
  const d = new Date(iso);
  return startOfDay(d);
}

export function eventsOnDate(events: Event[], date: Date): Event[] {
  return events.filter((e) => isSameCalendarDay(parseEventDate(e.start_date), date));
}

export function datesWithEvents(events: Event[], month: Date): Set<number> {
  const set = new Set<number>();
  const y = month.getFullYear();
  const m = month.getMonth();
  for (const e of events) {
    const d = parseEventDate(e.start_date);
    if (d.getFullYear() === y && d.getMonth() === m) {
      set.add(d.getDate());
    }
  }
  return set;
}

export interface CalendarCell {
  date: Date | null;
  day: number;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(visibleMonth: Date): CalendarCell[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startOffset; i++) {
    const prev = new Date(year, month, -startOffset + i + 1);
    cells.push({
      date: prev,
      day: prev.getDate(),
      inCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d),
      day: d,
      inCurrentMonth: true,
    });
  }

  while (cells.length < 42) {
    const nextIndex = cells.length - startOffset - daysInMonth + 1;
    const next = new Date(year, month + 1, nextIndex);
    cells.push({
      date: next,
      day: next.getDate(),
      inCurrentMonth: false,
    });
  }

  return cells;
}

export function formatEventTimeRange(event: Event): string {
  const start = event.start_time?.slice(0, 5) ?? '00:00';
  const endDate = new Date(event.end_date);
  const endH = String(endDate.getHours()).padStart(2, '0');
  const endM = String(endDate.getMinutes()).padStart(2, '0');
  return `${start} - ${endH}:${endM}`;
}

export function formatEventLocation(event: Event): string {
  if (event.room) return `${event.location} · ${event.room}`;
  return event.location;
}

export function combineDateAndTime(dateStrBr: string, timeStr: string): string {
  const trimmed = dateStrBr.trim();
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    throw new Error('Data inválida. Use o formato DD/MM/AAAA.');
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, h || 0, min || 0, 0).toISOString();
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function combineDateInputAndTime(dateInput: string, timeStr: string): string {
  const [y, m, d] = dateInput.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0, 0).toISOString();
}
