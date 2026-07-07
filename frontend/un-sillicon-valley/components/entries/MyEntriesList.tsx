"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon, RiDeleteBinLine, RiEditLine } from "@/components/icons";
import { deleteEntry, getEntriesByAuthor } from "@/lib/api";
import { type EntrySummary, formatPublishedDate } from "@/lib/types/entry";

type MyEntriesListProps = {
  authorId: number;
};

function DeleteConfirmDialog({
  entry,
  deleting,
  onConfirm,
  onCancel,
}: {
  entry: EntrySummary;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const modal = (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is a decorative overlay; dialog buttons remain keyboard-accessible.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="ds-headline mb-2 text-lg text-foreground">¿Eliminar entrada?</h2>
        <p className="text-sm text-muted">
          Vas a eliminar <span className="font-medium text-foreground">"{entry.title}"</span>. Esta
          acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="ds-btn ds-btn-primary ds-btn-pill px-4 py-2 text-sm"
          >
            {deleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

function EntryRow({
  entry,
  deleting,
  onDelete,
}: {
  entry: EntrySummary;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-background/30 p-4 transition hover:border-border/80">
      <div className="min-w-0 flex-1">
        <Link
          href={`/entries/${entry.id}`}
          className="truncate text-base font-bold text-foreground transition hover:text-primary"
        >
          {entry.title}
        </Link>
        <p className="mt-0.5 text-xs text-subtle">
          {formatPublishedDate(entry.published_at)} · {entry.view_count} vistas
        </p>
        {entry.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        <Link
          href={`/entries/${entry.id}/edit`}
          className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-foreground"
          aria-label="Editar entrada"
        >
          <Icon icon={RiEditLine} size={16} />
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-[var(--error)] disabled:opacity-50"
          aria-label="Eliminar entrada"
        >
          <Icon icon={RiDeleteBinLine} size={16} />
        </button>
      </div>
    </div>
  );
}

export function MyEntriesList({ authorId }: MyEntriesListProps) {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EntrySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getEntriesByAuthor(authorId);
        if (!cancelled) setEntries(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar tus entradas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authorId]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEntry(pendingDelete.id);
      setEntries((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la entrada.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando tus entradas...</p>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="ds-alert ds-alert-error">{error}</div>}

      {entries.length === 0 ? (
        <p className="text-sm text-subtle">Aún no has publicado entradas.</p>
      ) : (
        entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            deleting={deleting && pendingDelete?.id === entry.id}
            onDelete={() => setPendingDelete(entry)}
          />
        ))
      )}

      {pendingDelete && (
        <DeleteConfirmDialog
          entry={pendingDelete}
          deleting={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => !deleting && setPendingDelete(null)}
        />
      )}
    </div>
  );
}
