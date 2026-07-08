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

/** Minimal entry context attached to a comment in the moderation view. */
export type CommentEntry = {
  id: number;
  title: string;
  category: string | null;
};

export type AdminComment = Comment & {
  entry: CommentEntry;
};

export type AdminCommentListResponse = {
  items: AdminComment[];
  total: number;
};

export type CommentCreatePayload = {
  content: string;
};

export type CommentUpdatePayload = {
  content: string;
};
