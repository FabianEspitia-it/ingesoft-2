"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon, RiDeleteBinLine, RiExternalLinkLine } from "@/components/icons";
import { deleteCommentById } from "@/lib/api";
import type { AdminComment } from "@/lib/types/comment";

type CommentProp = {
  comment: AdminComment;
  onDeleted?: (id: number) => void;
};

function getInitial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

// "hace 3 horas", "hace 6 horas", "hace 1 día"…
function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat("es-CO", { numeric: "auto" });
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (Math.abs(sec) < 60) return rtf.format(-sec, "second");
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  if (Math.abs(hr) < 24) return rtf.format(-hr, "hour");
  if (Math.abs(day) < 30) return rtf.format(-day, "day");
  const month = Math.round(day / 30);
  if (Math.abs(month) < 12) return rtf.format(-month, "month");
  return rtf.format(-Math.round(month / 12), "year");
}

export function CommentCard({ comment, onDeleted }: CommentProp) {
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteComment() {
    setDeleting(true);
    try {
      await deleteCommentById(comment.id);
      onDeleted?.(comment.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <article className="ds-card p-5">
      {/* Contexto: entrada a la que pertenece el comentario */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-subtle">Comentario en:</span>
        <Link
          href={`/entries/${comment.entry.id}`}
          className="font-semibold text-foreground transition hover:text-primary"
        >
          &ldquo;{comment.entry.title}&rdquo;
        </Link>
        {comment.entry.category && (
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
            {comment.entry.category}
          </span>
        )}
      </div>

      {/* Comentario en sí */}
      <div className="rounded-xl border border-border bg-background/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background/60 text-sm font-semibold text-muted">
            {getInitial(comment.author.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-foreground">
                {comment.author.full_name}
              </span>
              <span className="text-xs text-subtle">{formatRelative(comment.published_at)}</span>
              {comment.edited_at && <span className="text-xs text-subtle">(editado)</span>}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
          </div>
        </div>
      </div>

      {/* Acciones de moderación */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <Link
          href={`/entries/${comment.entry.id}`}
          className="ds-btn ds-btn-ghost ds-btn-pill inline-flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          Ver en contexto
          <Icon icon={RiExternalLinkLine} size={15} />
        </Link>
        <button
          type="button"
          onClick={handleDeleteComment}
          disabled={deleting}
          className="ds-btn ds-btn-pill inline-flex items-center gap-1.5 bg-[var(--error)] px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Icon icon={RiDeleteBinLine} size={15} />
          {deleting ? "Eliminando..." : "Eliminar comentario"}
        </button>
      </div>
    </article>
  );
}
