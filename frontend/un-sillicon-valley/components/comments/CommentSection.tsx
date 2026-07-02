"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createComment, getComments, getCurrentUser } from "@/lib/api";
import type { Comment } from "@/lib/types/comment";
import { AFFILIATION_LABELS, formatPublishedDate } from "@/lib/types/entry";
import type { User } from "@/lib/types/user";

type CommentSectionProps = {
  entryId: number;
};

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
      // Newest first: prepend.
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
          comments.map((comment) => {
            const affiliation =
              AFFILIATION_LABELS[comment.author.affiliation] ?? comment.author.affiliation;
            return (
              <article key={comment.id} className="ds-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{comment.author.full_name}</p>
                  <span className="text-xs text-subtle">
                    {formatPublishedDate(comment.published_at)}
                  </span>
                </div>
                <p className="text-xs text-subtle">{affiliation}</p>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-foreground/90">
                  {comment.content}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
