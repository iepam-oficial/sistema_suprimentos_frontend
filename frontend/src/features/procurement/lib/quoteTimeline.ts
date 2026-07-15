import type { ProcurementQuoteEventDTO } from '../api/procurementQuoteApi';

export const TIMELINE_EVENT_TYPES = [
  'EMAIL_SENT',
  'EMAIL_DELIVERED',
  'PORTAL_ACCESSED',
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

function isTimelineEventType(eventType: string): eventType is TimelineEventType {
  return (TIMELINE_EVENT_TYPES as readonly string[]).includes(eventType);
}

function pickOldestByType(
  events: ProcurementQuoteEventDTO[],
  eventType: TimelineEventType,
): ProcurementQuoteEventDTO | null {
  const ofType = events.filter((event) => event.event_type === eventType);
  if (ofType.length === 0) return null;

  return ofType.reduce((oldest, current) =>
    new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest,
  );
}

function pickNewestPortalAccessed(
  events: ProcurementQuoteEventDTO[],
): ProcurementQuoteEventDTO | null {
  const ofType = events.filter((event) => event.event_type === 'PORTAL_ACCESSED');
  if (ofType.length === 0) return null;

  return ofType.reduce((newest, current) =>
    new Date(current.created_at) > new Date(newest.created_at) ? current : newest,
  );
}

export function buildSupplierTimelineEvents(
  events: ProcurementQuoteEventDTO[],
  inviteId: string,
): ProcurementQuoteEventDTO[] {
  const filtered = events.filter(
    (event) =>
      event.invite_id === inviteId && isTimelineEventType(event.event_type),
  );

  const result: ProcurementQuoteEventDTO[] = [];

  const emailSent = pickOldestByType(filtered, 'EMAIL_SENT');
  const emailDelivered = pickOldestByType(filtered, 'EMAIL_DELIVERED');
  const portalAccessed = pickNewestPortalAccessed(filtered);

  if (emailSent) result.push(emailSent);
  if (emailDelivered) result.push(emailDelivered);
  if (portalAccessed) result.push(portalAccessed);

  return result.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}
