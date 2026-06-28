export type UserAffiliation = "student" | "graduate" | "professor";
export type UserRole = "author" | "administrator";

export interface User {
  id: number;
  email: string;
  full_name: string;
  affiliation: UserAffiliation;
  role: UserRole;
  email_verified: boolean;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  affiliation: UserAffiliation;
  accepted_terms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export const AFFILIATION_LABELS: Record<UserAffiliation, string> = {
  student: "Estudiante",
  graduate: "Egresado",
  professor: "Docente",
};
