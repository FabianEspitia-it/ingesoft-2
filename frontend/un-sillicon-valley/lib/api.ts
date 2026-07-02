import type {
  Comment,
  CommentCreatePayload,
  CommentListResponse,
} from "@/lib/types/comment";
import type { EntryCreatePayload, EntryDetail, EntryListResponse } from "@/lib/types/entry";
import type {
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  User,
} from "@/lib/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://un-silicon-valley-236517281359.us-central1.run.app";

type ApiOptions = RequestInit & {
  json?: unknown;
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      detail?: string | { msg: string }[];
    } | null;

    let message = "Ocurrió un error inesperado.";
    if (typeof errorBody?.detail === "string") {
      message = errorBody.detail;
    } else if (Array.isArray(errorBody?.detail) && errorBody.detail[0]?.msg) {
      message = errorBody.detail[0].msg;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getEntries(page = 1): Promise<EntryListResponse> {
  return apiFetch<EntryListResponse>(`/entries?page=${page}`);
}

export function getEntry(id: number): Promise<EntryDetail> {
  return apiFetch<EntryDetail>(`/entries/${id}`);
}

export function createEntry(payload: EntryCreatePayload): Promise<EntryDetail> {
  return apiFetch<EntryDetail>("/entries", {
    method: "POST",
    json: payload,
  });
}

export function getCategories(): Promise<string[]> {
  return apiFetch<string[]>("/categories");
}

export function getComments(entryId: number): Promise<CommentListResponse> {
  return apiFetch<CommentListResponse>(`/entries/${entryId}/comments`);
}

export function createComment(
  entryId: number,
  payload: CommentCreatePayload,
): Promise<Comment> {
  return apiFetch<Comment>(`/entries/${entryId}/comments`, {
    method: "POST",
    json: payload,
  });
}

export function register(payload: RegisterPayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/auth/register", {
    method: "POST",
    json: payload,
  });
}

export function login(payload: LoginPayload): Promise<User> {
  return apiFetch<User>("/auth/login", {
    method: "POST",
    json: payload,
  });
}

export function logout(): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me");
  } catch {
    return null;
  }
}

export function verifyEmail(token: string): Promise<User> {
  return apiFetch<User>("/auth/verify-email", {
    method: "POST",
    json: { token },
  });
}

export { API_URL };
