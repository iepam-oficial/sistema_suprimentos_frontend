export type EventType =
  | 'FESTA'
  | 'AULA'
  | 'FORMATURA'
  | 'REUNIAO'
  | 'FEIRA_TECNOLOGICA'
  | 'ALUGUEL_SALA'
  | 'OUTRO';

export type EventStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface EventUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  start_date: string;
  end_date: string;
  start_time: string;
  location: string;
  room?: string | null;
  capacity?: number | null;
  is_public?: boolean;
  max_participants?: number | null;
  current_participants?: number;
  budget?: number | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  setup_requirements?: string | null;
  notes?: string | null;
  user: EventUser;
  participants?: {
    id: string;
    user: { id: string; name: string };
    role: string;
    status: string;
  }[];
  resources?: { id: string; name: string; quantity: number; description?: string }[];
}

export interface CreateEventPayload {
  title: string;
  description: string;
  type: EventType;
  start_date: string;
  start_time: string;
  end_date: string;
  location?: string;
  room?: string;
  is_public?: boolean;
}
