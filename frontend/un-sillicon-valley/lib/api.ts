import type { EntryCreatePayload, EntryDetail, EntryListResponse, FeaturedEntryResponse, ReactionSummary } from "@/lib/types/entry";
import type {
  Comment,
  CommentCreatePayload,
  CommentListResponse,
  CommentUpdatePayload,
} from "@/lib/types/comment";
import type {
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  UpdateUserPayload,
  User,
} from "@/lib/types/user";
import type {
  CreateProjectPayload,
  Project,
  ProjectListResponse,
  UpdateProjectPayload,
} from "@/lib/types/project";

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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getEntries(page = 1): Promise<EntryListResponse> {
  return apiFetch<EntryListResponse>(`/entries?page=${page}`);
}

export function getEntriesByAuthor(authorId: number, page = 1): Promise<EntryListResponse> {
  return apiFetch<EntryListResponse>(`/entries?author_id=${authorId}&page=${page}`);
}

export function getSuccessCases(page = 1): Promise<EntryListResponse> {
  return apiFetch<EntryListResponse>(`/entries?is_success_case=true&page=${page}`);
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

export function setSuccessCase(id: number, isSuccessCase: boolean): Promise<EntryDetail> {
  return apiFetch<EntryDetail>(`/entries/${id}/success-case`, {
    method: "PATCH",
    json: { is_success_case: isSuccessCase },
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

export function updateComment(
  entryId: number,
  commentId: number,
  payload: CommentUpdatePayload,
): Promise<Comment> {
  return apiFetch<Comment>(`/entries/${entryId}/comments/${commentId}`, {
    method: "PUT",
    json: payload,
  });
}

export function deleteComment(
  entryId: number,
  commentId: number,
): Promise<void> {
  return apiFetch<void>(`/entries/${entryId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function getReactions(entryId: number): Promise<ReactionSummary> {
  return apiFetch<ReactionSummary>(`/entries/${entryId}/reactions`);
}

export function toggleReaction(entryId: number, type: string): Promise<ReactionSummary> {
  return apiFetch<ReactionSummary>(`/entries/${entryId}/reactions`, {
    method: "POST",
    json: { type },
  });
}

export function getFeaturedEntries(page = 1): Promise<FeaturedEntryResponse> {
  return apiFetch<FeaturedEntryResponse>(`/entries/featured?page=${page}`);
}

export function getSearch(terms: string): Promise<EntryListResponse> {
  return apiFetch<EntryListResponse>(`/search?${terms}`);
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

export function updateUser(payload: UpdateUserPayload): Promise<User> {
  return apiFetch<User>("/users/me", {
    method: "PUT",
    json: payload,
  });
}

export function getUserById(id: number): Promise<User> {
  return apiFetch<User>(`/users/${id}`);
}

export function getMyProjects(userId: number): Promise<ProjectListResponse> {
  return apiFetch<ProjectListResponse>(`/projects?user_id=${userId}&page_size=100`);
}

export function createProject(payload: CreateProjectPayload): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    json: payload,
  });
}

export function updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, {
    method: "PUT",
    json: payload,
  });
}

export function deleteProject(id: number): Promise<void> {
  return apiFetch<void>(`/projects/${id}`, {
    method: "DELETE",
  });
}

export function deleteEntry(entry_id: number): Promise<EntryDetail> {
  return apiFetch<EntryDetail>(`/entries/${entry_id}`, {
    method: "PATCH",
  });
}

export { API_URL };