import { DangerLevel, type DangerLevel as DangerLevelType } from '../types';

const LABELS: Record<DangerLevelType, string> = {
  [DangerLevel.LOW]: 'Baixo',
  [DangerLevel.MEDIUM]: 'Médio',
  [DangerLevel.HIGH]: 'Alto',
};

const COLORS: Record<DangerLevelType, string> = {
  [DangerLevel.LOW]: 'green',
  [DangerLevel.MEDIUM]: 'yellow',
  [DangerLevel.HIGH]: 'red',
};

export function getDangerLevelLabel(level: string): string {
  return LABELS[level as DangerLevelType] ?? level;
}

export function getDangerLevelColor(level: string): string {
  return COLORS[level as DangerLevelType] ?? 'gray';
}

export function isCriticalDangerLevel(level: string): boolean {
  return level === DangerLevel.HIGH;
}
