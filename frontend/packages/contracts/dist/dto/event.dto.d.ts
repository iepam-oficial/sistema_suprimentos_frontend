import type { UserRefDTO } from './user.dto';
export declare const EventType: {
    readonly FESTA: "FESTA";
    readonly AULA: "AULA";
    readonly FORMATURA: "FORMATURA";
    readonly REUNIAO: "REUNIAO";
    readonly FEIRA_TECNOLOGICA: "FEIRA_TECNOLOGICA";
    readonly ALUGUEL_SALA: "ALUGUEL_SALA";
    readonly OUTRO: "OUTRO";
};
export type EventType = (typeof EventType)[keyof typeof EventType];
export declare const EventStatus: {
    readonly AGENDADO: "AGENDADO";
    readonly EM_ANDAMENTO: "EM_ANDAMENTO";
    readonly CONCLUIDO: "CONCLUIDO";
    readonly CANCELADO: "CANCELADO";
};
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
/** @deprecated Use UserRefDTO from user.dto */
export type EventUserRefDTO = UserRefDTO;
export interface EventParticipantDTO {
    id: string;
    event_id: string;
    user_id: string;
    role: string;
    status: string;
    user?: EventUserRefDTO;
}
export interface EventResourceDTO {
    id: string;
    event_id?: string;
    name: string;
    quantity: number;
    description?: string | null;
}
export interface EventDTO {
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
    created_by_user_id: string;
    created_at: string;
    updated_at: string;
    user: EventUserRefDTO;
    participants?: EventParticipantDTO[];
    resources?: EventResourceDTO[];
}
export interface CreateEventInput {
    title: string;
    description: string;
    type: EventType;
    start_date: string;
    start_time: string;
    end_date: string;
    location?: string;
    room?: string;
    capacity?: number;
    is_public?: boolean;
    max_participants?: number;
    budget?: number;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    setup_requirements?: string;
    notes?: string;
}
export interface UpdateEventInput {
    title?: string;
    description?: string;
    type?: EventType;
    start_date?: string;
    start_time?: string;
    end_date?: string;
    status?: EventStatus;
    location?: string;
    room?: string;
    capacity?: number;
    is_public?: boolean;
    max_participants?: number;
    budget?: number;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    setup_requirements?: string;
    notes?: string;
}
export interface AddEventParticipantInput {
    user_id: string;
    role: string;
}
export interface UpdateEventParticipantInput {
    status: string;
}
export interface AddEventResourceInput {
    name: string;
    quantity: number;
    description?: string;
}
export interface UpdateEventResourceInput {
    name?: string;
    quantity?: number;
    description?: string;
}
//# sourceMappingURL=event.dto.d.ts.map