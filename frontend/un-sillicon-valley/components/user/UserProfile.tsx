"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Icon,
  RiEditLine,
  RiExternalLinkLine,
  RiFolder3Line,
  RiGraduationCapLine,
  RiImage2Line,
  RiLinksLine,
  RiMailCheckLine,
  RiSettings4Line,
} from "@/components/icons";
import { getCurrentUser, getEntriesByAuthor, getMyProjects, getUserById } from "@/lib/api";
import type { EntrySummary } from "@/lib/types/entry";
import type { Project } from "@/lib/types/project";
import { AFFILIATION_LABELS, type User } from "@/lib/types/user";

type TabKey = "entries" | "portfolio" | "about";

function getInitial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

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

function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// ─── Estadística del encabezado ─────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="whitespace-nowrap text-sm text-muted">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  );
}

// ─── Fila de entrada del perfil ─────────────────────────────────────────────

function ProfileEntryRow({ entry }: { entry: EntrySummary }) {
  return (
    <article className="ds-card group grid grid-cols-[6rem_1fr] overflow-hidden transition-colors hover:border-primary/30 sm:grid-cols-[8rem_1fr]">
      <div className="relative min-h-24 w-full bg-border/20">
        {entry.cover_image_url ? (
          <Image
            src={entry.cover_image_url}
            alt=""
            fill
            sizes="8rem"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className="absolute inset-0 flex items-center justify-center text-subtle"
            aria-hidden
          >
            <Icon icon={RiImage2Line} size={20} />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {entry.categories[0] && (
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-medium text-accent">
              {entry.categories[0]}
            </span>
          )}
          {entry.is_success_case && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 font-semibold text-background">
              ⭐ caso de éxito
            </span>
          )}
          <time dateTime={entry.published_at} className="text-subtle">
            {formatShortDate(entry.published_at)}
          </time>
        </div>
        <h3 className="ds-headline line-clamp-2 text-base leading-snug sm:text-lg">
          <Link
            href={`/entries/${entry.id}`}
            className="transition-colors hover:text-primary focus-visible:text-primary"
          >
            {entry.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

// ─── Tarjeta de proyecto ────────────────────────────────────────────────────

function PortfolioItem({ project }: { project: Project }) {
  const href = normalizeUrl(project.url);
  return (
    <div className="border-t border-dashed border-border pt-4 first:border-0 first:pt-0">
      <p className="text-sm font-semibold text-foreground">{project.title}</p>
      {project.description && <p className="mt-0.5 text-xs text-muted">{project.description}</p>}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-subtle transition hover:text-primary"
        >
          <Icon icon={RiExternalLinkLine} size={12} />
          {project.url}
        </a>
      )}
    </div>
  );
}

// Tarjeta grande usada en la pestaña "Portafolio".
function PortfolioCard({ project }: { project: Project }) {
  const href = normalizeUrl(project.url);
  const content = (
    <>
      <p className="text-sm font-semibold text-foreground group-hover:text-primary">
        {project.title}
      </p>
      {project.description && (
        <p className="mt-1 line-clamp-3 text-xs text-muted">{project.description}</p>
      )}
      {project.url && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-subtle">
          <Icon icon={RiExternalLinkLine} size={12} />
          {project.url}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group ds-card block p-4 transition hover:border-primary/40"
      >
        {content}
      </a>
    );
  }
  return <div className="group ds-card p-4">{content}</div>;
}

// ─── Componente principal ───────────────────────────────────────────────────

type Props = {
  userId: string;
};

export function UserProfile({ userId }: Props) {
  const numericUserId = Number(userId);

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [tab, setTab] = useState<TabKey>("entries");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(numericUserId)) {
        setError("Usuario no válido.");
        setLoading(false);
        return;
      }

      try {
        const [userData, projectsData, entriesData, currentUser] = await Promise.all([
          getUserById(numericUserId),
          getMyProjects(numericUserId),
          getEntriesByAuthor(numericUserId),
          getCurrentUser(),
        ]);
        if (cancelled) return;
        setUser(userData);
        setProjects(projectsData.items);
        setEntries(entriesData.items);
        setIsOwner(currentUser?.id === numericUserId);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar este perfil.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [numericUserId]);

  const stats = useMemo(
    () => ({
      entries: entries.length,
      views: entries.reduce((sum, e) => sum + e.view_count, 0),
      likes: entries.reduce((sum, e) => sum + e.likes, 0),
      successCases: entries.filter((e) => e.is_success_case).length,
    }),
    [entries],
  );

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at)),
    [entries],
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl py-16 text-center text-sm text-muted">
        Cargando perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl py-16 text-center">
        <p className="text-sm text-muted">{error ?? "Este usuario no existe."}</p>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "entries", label: "Entradas", count: stats.entries },
    { key: "portfolio", label: "Portafolio", count: projects.length },
    { key: "about", label: "Sobre mí" },
  ];

  return (
    <div className="auth-reveal mx-auto w-full max-w-6xl px-6 py-10">
      {/* ── Cabecera del perfil ── */}
      <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background/50">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted">
              {getInitial(user.full_name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="ds-headline text-3xl text-foreground">{user.full_name}</h1>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/user/edit"
                  className="ds-btn ds-btn-ghost ds-btn-pill inline-flex items-center gap-1.5 px-4 py-1.5 text-xs"
                >
                  <Icon icon={RiEditLine} size={14} />
                  Editar perfil
                </Link>
                <Link
                  href="/user/publications"
                  className="ds-btn ds-btn-ghost ds-btn-pill inline-flex items-center gap-1.5 px-4 py-1.5 text-xs"
                >
                  <Icon icon={RiSettings4Line} size={14} />
                  Gestionar
                </Link>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-medium text-foreground">
              <Icon icon={RiGraduationCapLine} size={14} />
              {AFFILIATION_LABELS[user.affiliation]}
            </span>
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-subtle transition hover:text-foreground"
            >
              <Icon icon={RiMailCheckLine} size={14} />
              {user.email}
            </a>
          </div>

          {user.biography && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{user.biography}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:justify-start">
            <Stat value={formatCompact(stats.entries)} label="entradas" />
            <Stat value={formatCompact(stats.views)} label="vistas" />
            <Stat value={formatCompact(stats.likes)} label="likes" />
            <span className="inline-flex items-center gap-1">
              <Stat value={formatCompact(stats.successCases)} label="casos de éxito" />
              <span aria-hidden>⭐</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Pestañas ── */}
      <div className="mt-8 border-b border-border">
        <nav className="flex gap-6" aria-label="Secciones del perfil">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium transition ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-subtle hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
                {typeof t.count === "number" && (
                  <span className={active ? "text-primary" : "text-subtle"}> ({t.count})</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Cuerpo: contenido + barra lateral ── */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <main className="min-w-0">
          {tab === "entries" &&
            (sortedEntries.length === 0 ? (
              <p className="text-sm text-subtle">Este usuario aún no ha publicado entradas.</p>
            ) : (
              <div className="space-y-4">
                {sortedEntries.map((entry) => (
                  <ProfileEntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            ))}

          {tab === "portfolio" &&
            (projects.length === 0 ? (
              <p className="text-sm text-subtle">Este usuario aún no ha añadido proyectos.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <PortfolioCard key={project.id} project={project} />
                ))}
              </div>
            ))}

          {tab === "about" && (
            <div className="ds-card p-6">
              <p className="ds-eyebrow text-[0.65rem]">Afiliación</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground">
                <Icon icon={RiGraduationCapLine} size={16} />
                {AFFILIATION_LABELS[user.affiliation]}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-muted">
                {user.biography || "Este usuario aún no ha escrito una biografía."}
              </p>
            </div>
          )}
        </main>

        {/* ── Barra lateral ── */}
        <aside className="space-y-6">
          <section className="ds-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon icon={RiFolder3Line} size={16} />
              Portafolio
            </h2>
            {projects.length === 0 ? (
              <p className="text-xs text-subtle">Sin proyectos.</p>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 4).map((project) => (
                  <PortfolioItem key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

          <section className="ds-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon icon={RiLinksLine} size={16} />
              Enlaces
            </h2>
            <a
              href={`mailto:${user.email}`}
              className="flex items-center gap-2 text-sm text-subtle transition hover:text-primary"
            >
              <Icon icon={RiMailCheckLine} size={14} />
              <span className="truncate">{user.email}</span>
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
