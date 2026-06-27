import type { EntryCreatePayload, EntryDetail, EntryListResponse } from "@/lib/types/entry";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9999";

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

export { API_URL };
