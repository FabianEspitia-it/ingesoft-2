"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  Icon,
  RiAddLine,
  RiChat3Line,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiImage2Line,
  RiSearchLine,
  RiThumbUpLine,
} from "@/components/icons";
import { deleteEntry, getCurrentUser, getEntriesByAuthor } from "@/lib/api";
import type { EntrySummary } from "@/lib/types/entry";

// Formatea números grandes de forma compacta: 5800 → "5.8k".
function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  const k = value / 1000;
  return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
}

// "24 May 2026" — mes abreviado y capitalizado.
function formatShortDate(iso: string): string {
  const formatted = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
  return formatted.replace(/\b([a-záéíóú])/, (m) => m.toUpperCase());
}

// ─── Diálogo de confirmación ────────────────────────────────────────────────

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
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop decorativo; los botones del diálogo son accesibles por teclado.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="ds-headline mb-2 text-lg text-foreground">¿Eliminar entrada?</h2>
        <p className="text-sm text-muted">
          Esta acción es permanente. También se borrarán los comentarios asociados a{" "}
          <span className="font-medium text-foreground">&ldquo;{entry.title}&rdquo;</span>.
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
            className="ds-btn ds-btn-pill bg-[var(--error)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
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

// ─── Tarjeta de estadística ─────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ds-card p-5">
      <p className="ds-eyebrow text-[0.65rem]">{label}</p>
      <p className="ds-headline mt-1.5 text-3xl text-foreground">{value}</p>
    </div>
  );
}

// ─── Fila de la tabla ───────────────────────────────────────────────────────

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
    <tr className="border-t border-border transition-colors hover:bg-background/40">
      {/* Entrada */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-background/50 text-subtle">
            {entry.cover_image_url ? (
              <Image
                src={entry.cover_image_url}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Icon icon={RiImage2Line} size={18} />
              </span>
            )}
          </div>
          <Link
            href={`/entries/${entry.id}`}
            className="line-clamp-2 text-sm font-semibold text-foreground transition hover:text-primary"
          >
            {entry.title}
          </Link>
        </div>
      </td>

      {/* Categoría */}
      <td className="px-3 py-3">
        {entry.categories[0] ? (
          <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {entry.categories[0]}
          </span>
        ) : (
          <span className="text-xs text-subtle">—</span>
        )}
      </td>

      {/* Publicada */}
      <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">
        {formatShortDate(entry.published_at)}
      </td>

      {/* Métricas */}
      <td className="px-3 py-3 text-right text-sm tabular-nums text-muted">
        {formatCompact(entry.view_count)}
      </td>
      <td className="px-3 py-3 text-right text-sm tabular-nums text-muted">
        {formatCompact(entry.comments_count)}
      </td>
      <td className="px-3 py-3 text-right text-sm tabular-nums text-muted">
        {formatCompact(entry.likes)}
      </td>

      {/* Acciones */}
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/entries/${entry.id}`}
            className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-foreground"
            aria-label="Ver entrada"
          >
            <Icon icon={RiEyeLine} size={16} />
          </Link>
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
      </td>
    </tr>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export function MyPublications() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<EntrySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error("No se pudo cargar tu sesión.");
        const data = await getEntriesByAuthor(user.id);
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
  }, []);

  const stats = useMemo(
    () => ({
      published: entries.length,
      views: entries.reduce((sum, e) => sum + e.view_count, 0),
      likes: entries.reduce((sum, e) => sum + e.likes, 0),
      comments: entries.reduce((sum, e) => sum + e.comments_count, 0),
    }),
    [entries],
  );

  const visibleEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...entries]
      .filter((e) => (term ? e.title.toLowerCase().includes(term) : true))
      .sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at));
  }, [entries, query]);

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

  return (
    <div className="auth-reveal">
      {/* Encabezado */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav aria-label="Ruta de navegación" className="mb-1.5 text-xs text-subtle">
            <Link href="/user/edit" className="transition hover:text-foreground">
              Mi cuenta
            </Link>{" "}
            <span aria-hidden>›</span> <span className="text-muted">Mis publicaciones</span>
          </nav>
          <h1 className="ds-headline text-3xl text-foreground xl:text-[2.25rem]">
            Mis publicaciones
          </h1>
        </div>
        <Link href="/entries/new" className="ds-btn ds-btn-primary ds-btn-pill px-5 py-2.5 text-sm">
          <Icon icon={RiAddLine} size={16} />
          Crear entrada
        </Link>
      </header>

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Entradas publicadas" value={formatCompact(stats.published)} />
        <StatCard label="Vistas totales" value={formatCompact(stats.views)} />
        <StatCard label="Likes recibidos" value={formatCompact(stats.likes)} />
        <StatCard label="Comentarios" value={formatCompact(stats.comments)} />
      </div>

      {/* Búsqueda + orden */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle">
            <Icon icon={RiSearchLine} size={18} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en mis entradas..."
            className="auth-input auth-input-compact auth-input-search"
            aria-label="Buscar en mis entradas"
          />
        </div>
        <p className="text-xs text-subtle">Orden: descendente por fecha</p>
      </div>

      {error && (
        <div role="alert" className="ds-alert ds-alert-error mb-4">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="ds-card overflow-hidden">
        {loading ? (
          <p className="py-16 text-center text-sm text-muted">Cargando tus entradas...</p>
        ) : visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-muted">
              {entries.length === 0
                ? "Aún no has publicado entradas."
                : "Sin resultados para tu búsqueda."}
            </p>
            {entries.length === 0 && (
              <Link href="/entries/new" className="ds-link text-sm">
                Crea tu primera entrada
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  <th className="py-3 pl-4 pr-3 font-semibold">Entrada</th>
                  <th className="px-3 py-3 font-semibold">Categoría</th>
                  <th className="px-3 py-3 font-semibold">Publicada</th>
                  <th className="px-3 py-3 text-right font-semibold">
                    <span className="inline-flex" title="Vistas">
                      <Icon icon={RiEyeLine} size={16} />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    <span className="inline-flex" title="Comentarios">
                      <Icon icon={RiChat3Line} size={16} />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    <span className="inline-flex" title="Likes">
                      <Icon icon={RiThumbUpLine} size={16} />
                    </span>
                  </th>
                  <th className="py-3 pl-3 pr-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    deleting={deleting && pendingDelete?.id === entry.id}
                    onDelete={() => setPendingDelete(entry)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
