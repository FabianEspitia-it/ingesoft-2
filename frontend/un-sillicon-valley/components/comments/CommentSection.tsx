"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createComment, deleteComment, getComments, getCurrentUser, updateComment } from "@/lib/api";
import type { Comment } from "@/lib/types/comment";
import { AFFILIATION_LABELS, formatPublishedDate } from "@/lib/types/entry";
import type { User } from "@/lib/types/user";

type CommentSectionProps = {
  entryId: number;
};

function CommentItem({
  comment,
  currentUserId,
  entryId,
  onUpdated,
  onDeleted,
}: {
  comment: Comment;
  currentUserId: number | null;
  entryId: number;
  onUpdated: (updated: Comment) => void;
  onDeleted: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId !== null && currentUserId === comment.author.id;
  const affiliation = AFFILIATION_LABELS[comment.author.affiliation] ?? comment.author.affiliation;

  async function handleSaveEdit() {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateComment(entryId, comment.id, { content: editContent.trim() });
      onUpdated(updated);
      setIsEditing(false);
    } catch {
      // keep editing on error
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteComment(entryId, comment.id);
      onDeleted(comment.id);
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <article className="ds-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{comment.author.full_name}</p>
        <div className="flex items-center gap-2">
          {comment.edited_at && (
            <span className="text-xs italic text-subtle">(editado)</span>
          )}
          <span className="text-xs text-subtle">
            {formatPublishedDate(comment.published_at)}
          </span>
        </div>
      </div>
      <p className="text-xs text-subtle">{affiliation}</p>

      {isEditing ? (
        <div className="mt-3 space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="auth-input auth-input-compact resize-y"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving || !editContent.trim()}
              className="ds-btn ds-btn-primary ds-btn-pill px-4 py-1.5 text-xs"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-1.5 text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-foreground/90">
            {comment.content}
          </p>

          {isOwner && (
            <div className="mt-3 flex gap-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-subtle">¿Eliminar comentario?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="comment-action-btn comment-action-btn--danger"
                  >
                    {isDeleting ? "Eliminando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="comment-action-btn"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="comment-action-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="comment-action-btn comment-action-btn--danger"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                    Eliminar
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function CommentSection({ entryId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [currentUser, list] = await Promise.all([
        getCurrentUser(),
        getComments(entryId).catch(() => ({ items: [], total: 0 })),
      ]);
      if (cancelled) return;
      setUser(currentUser);
      setComments(list.items);
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createComment(entryId, { content });
      setComments((current) => [created, ...current]);
      setContent("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "No se pudo publicar el comentario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCommentUpdated(updated: Comment) {
    setComments((current) =>
      current.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  function handleCommentDeleted(id: number) {
    setComments((current) => current.filter((c) => c.id !== id));
  }

  return (
    <section className="mt-10">
      <h2 className="ds-headline text-2xl text-foreground">
        Comentarios {comments.length > 0 && <span className="text-subtle">({comments.length})</span>}
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="ds-card mt-4 space-y-3 p-5">
          {error && <div className="ds-alert ds-alert-error">{error}</div>}
          <label htmlFor="comment" className="ds-label">
            Escribe un comentario
          </label>
          <textarea
            id="comment"
            required
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="auth-input auth-input-compact resize-y"
            placeholder="Comparte tu opinión sobre esta entrada"
          />
          <div>
            <button
              type="submit"
              disabled={isSubmitting || content.trim() === ""}
              className="ds-btn ds-btn-primary ds-btn-pill"
            >
              {isSubmitting ? "Publicando..." : "Publicar comentario"}
            </button>
          </div>
        </form>
      ) : (
        <div className="ds-card mt-4 px-5 py-4 text-sm text-muted">
          <Link href={`/login?next=/entries/${entryId}`} className="text-accent hover:underline">
            Inicia sesión
          </Link>{" "}
          para dejar un comentario.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-subtle">Cargando comentarios...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no hay comentarios. Sé el primero en comentar.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id ?? null}
              entryId={entryId}
              onUpdated={handleCommentUpdated}
              onDeleted={handleCommentDeleted}
            />
          ))
        )}
      </div>
    </section>
  );
}
