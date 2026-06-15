import type {
  AddEventParticipantInput,
  AddEventResourceInput,
  CreateEventInput,
  EventDTO,
  EventParticipantDTO,
  EventResourceDTO,
  UpdateEventInput,
} from '../types';

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro na requisição de eventos'
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export async function fetchEvents(token: string): Promise<EventDTO[]> {
  const response = await fetch('/api/events', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<EventDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchEventById(token: string, id: string): Promise<EventDTO> {
  const response = await fetch(`/api/events/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<EventDTO>(response);
}

export async function createEvent(
  token: string,
  data: CreateEventInput
): Promise<EventDTO> {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<EventDTO>(response);
}

export async function updateEvent(
  token: string,
  id: string,
  data: UpdateEventInput
): Promise<EventDTO> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<EventDTO>(response);
}

export async function deleteEvent(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<void>(response);
}

export async function fetchEventParticipants(
  token: string,
  eventId: string
): Promise<EventParticipantDTO[]> {
  const response = await fetch(`/api/events/${eventId}/participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<EventParticipantDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function addEventParticipant(
  token: string,
  eventId: string,
  data: AddEventParticipantInput
): Promise<EventParticipantDTO> {
  const response = await fetch(`/api/events/${eventId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<EventParticipantDTO>(response);
}

export async function fetchEventResources(
  token: string,
  eventId: string
): Promise<EventResourceDTO[]> {
  const response = await fetch(`/api/events/${eventId}/resources`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<EventResourceDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function addEventResource(
  token: string,
  eventId: string,
  data: AddEventResourceInput
): Promise<EventResourceDTO> {
  const response = await fetch(`/api/events/${eventId}/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<EventResourceDTO>(response);
}
