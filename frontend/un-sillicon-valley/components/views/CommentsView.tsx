"use client";

import { useEffect, useMemo, useState } from "react";

import { CommentCard } from "@/components/comments/CommentCard";
import { Icon, RiSearchLine } from "@/components/icons";
import { getAllComments } from "@/lib/api";
import type { AdminComment } from "@/lib/types/comment";

type Filter = "todos" | "recientes" | "editados";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "recientes", label: "Recientes" },
  { key: "editados", label: "Editados" },
];

// Ventana para el filtro "Recientes": últimas 48 horas.
const RECENT_WINDOW_MS = 48 * 60 * 60 * 1000;

export default function CommentsView() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  useEffect(() => {
    let cancelled = false;

    async function fetchCommentsData() {
      try {
        const data = await getAllComments();
        if (!cancelled) setComments(data.items);
      } catch {
        if (!cancelled) setError("No se pudieron cargar los comentarios.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCommentsData();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleComments = useMemo(() => {
    const term = query.trim().toLowerCase();
    const now = Date.now();
    return comments.filter((c) => {
      if (filter === "editados" && !c.edited_at) return false;
      if (filter === "recientes" && now - new Date(c.published_at).getTime() > RECENT_WINDOW_MS) {
        return false;
      }
      if (!term) return true;
      return (
        c.content.toLowerCase().includes(term) ||
        c.author.full_name.toLowerCase().includes(term) ||
        c.entry.title.toLowerCase().includes(term)
      );
    });
  }, [comments, query, filter]);

  function handleDeleted(id: number) {
    setComments((current) => current.filter((c) => c.id !== id));
  }

  return (
    <div className="auth-reveal mx-auto max-w-4xl">
      {/* Encabezado */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav aria-label="Ruta de navegación" className="mb-1.5 text-xs text-subtle">
            <span className="text-muted">Panel admin</span> <span aria-hidden>›</span>{" "}
            <span>Comentarios</span>
          </nav>
          <h1 className="ds-headline text-3xl text-foreground xl:text-[2.25rem]">
            Moderar comentarios
          </h1>
        </div>

        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle">
            <Icon icon={RiSearchLine} size={18} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar comentario, autor..."
            className="auth-input auth-input-compact auth-input-search"
            aria-label="Buscar comentario o autor"
          />
        </div>
      </header>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`ds-btn ds-btn-pill px-4 py-1.5 text-sm transition ${
                active ? "ds-btn-primary" : "ds-btn-ghost"
              }`}
              aria-pressed={active}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="ds-alert ds-alert-error mb-4">
          {error}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Cargando comentarios...</p>
      ) : visibleComments.length > 0 ? (
        <div className="space-y-5">
          {visibleComments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        <div className="ds-card border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted">
            {comments.length === 0
              ? "No se encontraron comentarios."
              : "Sin resultados para este filtro."}
          </p>
        </div>
      )}
    </div>
  );
}
