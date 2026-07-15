import type { UserRole } from '../enums';

/** Referência mínima de usuário em relações cross-domain */
export interface UserRefDTO {
  id: string;
  name: string;
  email?: string;
  role?: UserRole | string;
}

/** DTO público de usuário — sem campos internos como password_hash */
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sector_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserSectorRefDTO {
  id: string;
  name: string;
  location: {
    id: string;
    name: string;
    branch: string;
  };
}

export interface UserWithSectorDTO extends UserDTO {
  sector?: UserSectorRefDTO | null;
}

export interface UserEventSummaryDTO {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
}

export interface UserEventParticipationDTO {
  id: string;
  role: string;
  status: string;
  event: UserEventSummaryDTO;
}

export interface UserDetailDTO extends UserWithSectorDTO {
  events?: UserEventSummaryDTO[];
  eventParticipations?: UserEventParticipationDTO[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  sector_id?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  sector_id?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionResponseDTO {
  user: UserDTO;
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshSessionInput {
  refreshToken: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
