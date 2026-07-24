import type { ProcurementQuoteEventDTO } from '@/features/procurement/api/procurementQuoteApi';
import { buildSupplierTimelineEvents } from '@/features/procurement/lib/quoteTimeline';

const INVITE_A = 'invite-a';
const INVITE_B = 'invite-b';
const QUOTE_ID = 'quote-1';

function makeEvent(
  overrides: Partial<ProcurementQuoteEventDTO> &
    Pick<ProcurementQuoteEventDTO, 'id' | 'event_type' | 'created_at'>,
): ProcurementQuoteEventDTO {
  return {
    procurement_quote_id: QUOTE_ID,
    invite_id: INVITE_A,
    metadata: null,
    ...overrides,
  };
}

describe('buildSupplierTimelineEvents', () => {
  it('returns empty array when no events match invite', () => {
    const events = [
      makeEvent({
        id: '1',
        event_type: 'EMAIL_SENT',
        created_at: '2026-06-01T10:00:00.000Z',
        invite_id: INVITE_B,
      }),
    ];

    expect(buildSupplierTimelineEvents(events, INVITE_A)).toEqual([]);
  });

  it('returns empty array when invite has no timeline events', () => {
    const events = [
      makeEvent({
        id: '1',
        event_type: 'EMAIL_OPENED',
        created_at: '2026-06-01T10:00:00.000Z',
      }),
      makeEvent({
        id: '2',
        event_type: 'PROPOSAL_SUBMITTED',
        created_at: '2026-06-01T11:00:00.000Z',
      }),
    ];

    expect(buildSupplierTimelineEvents(events, INVITE_A)).toEqual([]);
  });

  it('keeps oldest EMAIL_SENT when duplicates exist', () => {
    const oldest = makeEvent({
      id: 'sent-old',
      event_type: 'EMAIL_SENT',
      created_at: '2026-06-01T08:00:00.000Z',
    });
    const newer = makeEvent({
      id: 'sent-new',
      event_type: 'EMAIL_SENT',
      created_at: '2026-06-01T12:00:00.000Z',
    });

    const result = buildSupplierTimelineEvents([newer, oldest], INVITE_A);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sent-old');
  });

  it('keeps oldest EMAIL_DELIVERED when duplicates exist', () => {
    const oldest = makeEvent({
      id: 'del-old',
      event_type: 'EMAIL_DELIVERED',
      created_at: '2026-06-01T09:00:00.000Z',
    });
    const newer = makeEvent({
      id: 'del-new',
      event_type: 'EMAIL_DELIVERED',
      created_at: '2026-06-01T13:00:00.000Z',
    });

    const result = buildSupplierTimelineEvents([newer, oldest], INVITE_A);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('del-old');
  });

  it('keeps only most recent PORTAL_ACCESSED', () => {
    const older = makeEvent({
      id: 'portal-old',
      event_type: 'PORTAL_ACCESSED',
      created_at: '2026-06-01T10:00:00.000Z',
    });
    const newest = makeEvent({
      id: 'portal-new',
      event_type: 'PORTAL_ACCESSED',
      created_at: '2026-06-01T15:00:00.000Z',
    });

    const result = buildSupplierTimelineEvents([older, newest], INVITE_A);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('portal-new');
  });

  it('ignores EMAIL_OPENED and other non-timeline types', () => {
    const events = [
      makeEvent({
        id: 'opened',
        event_type: 'EMAIL_OPENED',
        created_at: '2026-06-01T09:00:00.000Z',
      }),
      makeEvent({
        id: 'sent',
        event_type: 'EMAIL_SENT',
        created_at: '2026-06-01T10:00:00.000Z',
      }),
      makeEvent({
        id: 'proposal',
        event_type: 'PROPOSAL_SUBMITTED',
        created_at: '2026-06-01T11:00:00.000Z',
      }),
      makeEvent({
        id: 'declined',
        event_type: 'INVITE_DECLINED',
        created_at: '2026-06-01T12:00:00.000Z',
      }),
    ];

    const result = buildSupplierTimelineEvents(events, INVITE_A);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sent');
  });

  it('returns at most three events in chronological order', () => {
    const events = [
      makeEvent({
        id: 'portal-1',
        event_type: 'PORTAL_ACCESSED',
        created_at: '2026-06-01T14:00:00.000Z',
      }),
      makeEvent({
        id: 'portal-2',
        event_type: 'PORTAL_ACCESSED',
        created_at: '2026-06-01T16:00:00.000Z',
      }),
      makeEvent({
        id: 'delivered',
        event_type: 'EMAIL_DELIVERED',
        created_at: '2026-06-01T11:00:00.000Z',
      }),
      makeEvent({
        id: 'sent',
        event_type: 'EMAIL_SENT',
        created_at: '2026-06-01T10:00:00.000Z',
      }),
    ];

    const result = buildSupplierTimelineEvents(events, INVITE_A);

    expect(result.map((event) => event.id)).toEqual(['sent', 'delivered', 'portal-2']);
  });

  it('isolates events per invite', () => {
    const events = [
      makeEvent({
        id: 'a-sent',
        event_type: 'EMAIL_SENT',
        created_at: '2026-06-01T10:00:00.000Z',
        invite_id: INVITE_A,
      }),
      makeEvent({
        id: 'b-sent',
        event_type: 'EMAIL_SENT',
        created_at: '2026-06-01T10:00:00.000Z',
        invite_id: INVITE_B,
      }),
    ];

    expect(buildSupplierTimelineEvents(events, INVITE_A).map((e) => e.id)).toEqual(['a-sent']);
    expect(buildSupplierTimelineEvents(events, INVITE_B).map((e) => e.id)).toEqual(['b-sent']);
  });

  it('handles partial timeline (only EMAIL_SENT)', () => {
    const events = [
      makeEvent({
        id: 'sent',
        event_type: 'EMAIL_SENT',
        created_at: '2026-06-01T10:00:00.000Z',
      }),
    ];

    expect(buildSupplierTimelineEvents(events, INVITE_A)).toEqual([events[0]]);
  });

  it('handles empty input', () => {
    expect(buildSupplierTimelineEvents([], INVITE_A)).toEqual([]);
  });
});
