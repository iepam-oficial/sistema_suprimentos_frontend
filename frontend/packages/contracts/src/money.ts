import { add, dinero, multiply, subtract, toDecimal } from 'dinero.js';

type MoneyInput = number | string;

const BRL = { code: 'BRL', base: 10, exponent: 2 } as const;
const MONEY_CURRENCY = 'BRL';

function toNumber(value: MoneyInput): number {
  if (typeof value === 'number') return value;
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toMinor(value: MoneyInput): number {
  return Math.round(toNumber(value) * 100);
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

function money(value: MoneyInput) {
  return dinero({
    amount: toMinor(value),
    currency: BRL,
  });
}

function fromDinero(value: ReturnType<typeof dinero>): number {
  return fromMinor(toMinor(Number(toDecimal(value))));
}

function toScaledMultiplier(multiplier: number): number | { amount: number; scale: number } {
  if (Number.isInteger(multiplier)) return multiplier;
  const asString = multiplier.toString();
  const decimals = asString.includes('.') ? asString.split('.')[1].length : 0;
  return {
    amount: Number(asString.replace('.', '')),
    scale: decimals,
  };
}

export function addMoney(a: MoneyInput, b: MoneyInput): number {
  return fromDinero(add(money(a), money(b)));
}

export function subMoney(a: MoneyInput, b: MoneyInput): number {
  return fromDinero(subtract(money(a), money(b)));
}

export function mulMoney(value: MoneyInput, multiplier: number): number {
  return fromDinero(multiply(money(value), toScaledMultiplier(multiplier)));
}

export function sumMoney(values: MoneyInput[]): number {
  const totalMinor = values.reduce<number>((acc, current) => acc + toMinor(current), 0);
  return fromMinor(totalMinor);
}

export function formatBRL(value: MoneyInput): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: MONEY_CURRENCY,
  }).format(fromMinor(toMinor(value)));
}
