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
