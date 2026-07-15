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

const EVENT_MANAGER_ROLES = ['ADMIN', 'MANAGER', 'ORGANIZER'] as const;

function isEventManager(role: string | undefined): boolean {
  return EVENT_MANAGER_ROLES.includes(role as (typeof EVENT_MANAGER_ROLES)[number]);
}

export function canChangeEventStatus(role: string | undefined): boolean {
  return isEventManager(role);
}

export function canCreateEvent(role: string | undefined): boolean {
  return isEventManager(role);
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
