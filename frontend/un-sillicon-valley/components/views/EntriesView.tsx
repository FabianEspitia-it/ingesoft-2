"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon, RiDeleteBinLine } from "@/components/icons";
import { deleteEntry, getAllEntries } from "@/lib/api";
import type { EntrySummary } from "@/lib/types/entry";
import { EntryCard } from "../entries/EntryCard";

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
          Vas a eliminar <span className="font-medium text-foreground">"{entry.title}"</span> como
          administrador. Esta acción no se puede deshacer.
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

export default function EntriesView() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EntrySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchEntriesData() {
      try {
        const data = await getAllEntries();
        if (!cancelled) setEntries(data.items);
      } catch {
        if (!cancelled) setLoadError("No se pudieron cargar las entradas.");
      }
    }

    fetchEntriesData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteEntry(pendingDelete.id);
      setEntries((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setLoadError("No se pudo eliminar la entrada.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Entradas Admin</h1>
      <p className="text-muted">Modera las entradas publicadas por la comunidad.</p>

      {loadError && <div className="ds-alert ds-alert-error mt-4">{loadError}</div>}

      <section className="mt-6 space-y-4">
        {entries.length > 0
          ? entries.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <EntryCard entry={entry} />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(entry)}
                    disabled={deleting}
                    className="ds-btn ds-btn-ghost ds-btn-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    <Icon icon={RiDeleteBinLine} size={16} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          : !loadError && (
              <div className="ds-card border-dashed px-6 py-12 text-center">
                <p className="text-muted">No se encontraron entradas.</p>
              </div>
            )}
      </section>

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
