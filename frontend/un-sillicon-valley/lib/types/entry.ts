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
  is_success_case: boolean;
  likes: number;
  comments_count: number;
  cover_image_url: string | null;
  author: AuthorSummary;
  categories: string[];
  tags: string[];
};

export type EntryDetail = EntrySummary & {
  body: string;
  updated_at: string | null;
  /** Object path stored on the entry (used to round-trip on edit). */
  cover_image: string | null;
  /** Short-lived signed URL for displaying the cover image. */
  cover_image_url: string | null;
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
  cover_image?: string | null;
  category_names?: string[];
  tags?: string[];
};

export type EntryUpdatePayload = {
  title?: string;
  body?: string;
  cover_image?: string | null;
  category_names?: string[];
  tags?: string[];
};

export type CoverImageResponse = {
  /** Object path to persist as the entry's cover_image. */
  path: string;
  /** Short-lived signed URL for previewing the just-uploaded image. */
  url: string | null;
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
  cover_image_url: string | null;
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
