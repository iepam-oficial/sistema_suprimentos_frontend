import { todayLocalIsoDate } from '@/utils/civilDate'

export function reportExportFileName(
  slug: string,
  ext: 'xlsx' | 'pdf',
  now: Date = new Date(),
): string {
  return `${slug}-${todayLocalIsoDate(now)}.${ext}`
}
