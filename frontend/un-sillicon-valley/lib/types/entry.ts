export type AuthorSummary = {
  id: number;
  full_name: string;
  affiliation: string;
};

export type EntrySummary = {
  id: number;
  title: string;
  published_at: string;
  view_count: number;
  author: AuthorSummary;
  categories: string[];
  tags: string[];
};

export type EntryDetail = EntrySummary & {
  body: string;
  updated_at: string | null;
  cover_image: string | null;
};

export type EntryListResponse = {
  items: EntrySummary[];
  total: number;
  page: number;
  page_size: number;
};

export type EntryCreatePayload = {
  title: string;
  body: string;
  category_names?: string[];
  tags?: string[];
};

export type ReactionSummary = {
  likes: number;
  dislikes: number;
  user_reaction: string | null;
};

export type FeaturedEntrySummary = {
  id: number;
  title: string;
  published_at: string;
  view_count: number;
  likes: number;
  comments_count: number;
  author: AuthorSummary;
  categories: string[];
  tags: string[];
};

export type FeaturedEntryResponse = {
  items: FeaturedEntrySummary[];
  total: number;
  page: number;
  page_size: number;
};

export const AFFILIATION_LABELS: Record<string, string> = {
  student: "Estudiante",
  graduate: "Egresado",
  professor: "Docente",
};

export function formatPublishedDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(isoDate));
}
