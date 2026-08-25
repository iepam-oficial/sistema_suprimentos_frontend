import type { EventDTO } from '@ti-assistant/contracts';

export type {
  EventType,
  EventStatus,
  EventUserRefDTO,
  EventParticipantDTO,
  EventResourceDTO,
  EventDTO,
  CreateEventInput,
  UpdateEventInput,
  AddEventParticipantInput,
  AddEventResourceInput,
  UpdateEventResourceInput,
} from '@ti-assistant/contracts';

export type Event = EventDTO;
export type CreateEventPayload = import('@ti-assistant/contracts').CreateEventInput;
export type EventUser = import('@ti-assistant/contracts').EventUserRefDTO;

import { hasAnyRole } from '@ti-assistant/contracts/dist/roles';

const EVENT_MANAGER_ROLES = ['ADMIN', 'MANAGER', 'ORGANIZER'] as const;

export function canChangeEventStatus(roles: readonly string[] | undefined): boolean {
  return hasAnyRole(roles ?? [], ...(EVENT_MANAGER_ROLES as readonly string[]));
}

export function canCreateEvent(roles: readonly string[] | undefined): boolean {
  return hasAnyRole(roles ?? [], ...(EVENT_MANAGER_ROLES as readonly string[]));
}

export function getEventStatusChakraColor(status: string): string {
  switch (status) {
    case 'AGENDADO':
      return 'yellow';
    case 'EM_ANDAMENTO':
      return 'blue';
    case 'CONCLUIDO':
      return 'green';
    case 'CANCELADO':
      return 'red';
    default:
      return 'gray';
  }
}
