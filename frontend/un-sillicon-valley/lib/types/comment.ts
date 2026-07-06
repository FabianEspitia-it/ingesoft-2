export type CommentAuthor = {
  id: number;
  full_name: string;
  affiliation: string;
};

export type Comment = {
  id: number;
  content: string;
  published_at: string;
  edited_at: string | null;
  author: CommentAuthor;
};

export type CommentListResponse = {
  items: Comment[];
  total: number;
};

export type CommentCreatePayload = {
  content: string;
};

export type CommentUpdatePayload = {
  content: string;
};
