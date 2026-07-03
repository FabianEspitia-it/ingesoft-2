"use client";

import { useEffect, useState } from "react";
import { Icon, RiImage2Line, RiMailCheckLine, RiQuillPenLine } from "@/components/icons";
import { AFFILIATION_LABELS, type User } from "@/lib/types/user";
import type { Project } from "@/lib/types/project";
import type { EntrySummary } from "@/lib/types/entry";
import { getEntriesByAuthor, getMyProjects, getUserById } from "@/lib/api";
import { EntryCard } from "@/components/entries/EntryCard";

function getInitial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-subtle">
      {children}
    </h2>
  );
}

function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={normalizeUrl(project.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-xl border border-border bg-background/30 p-4 transition hover:border-primary/40 hover:bg-background/60"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {project.title}
        </p>
        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{project.description}</p>
        )}
        {project.url && <p className="mt-1 truncate text-xs text-subtle">{project.url}</p>}
      </div>
    </a>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

type Props = {
  userId: string;
};

export function UserProfile({ userId }: Props) {
  const numericUserId = Number(userId);

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<EntrySummary[]>([]);

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
        const [userData, projectsData, entriesData] = await Promise.all([
          getUserById(numericUserId),
          getMyProjects(numericUserId),
          getEntriesByAuthor(numericUserId),
        ]);
        if (cancelled) return;
        setUser(userData);
        setProjects(projectsData.items);
        setEntries(entriesData.items);
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-6 py-10">
      {/* ── Cabecera del perfil ── */}
      <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background/50">
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted">
              {getInitial(user.full_name)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="ds-headline text-2xl text-foreground">{user.full_name}</h1>
          <p className="mt-1 text-sm text-muted">{AFFILIATION_LABELS[user.affiliation]}</p>
          <a
            href={`mailto:${user.email}`}
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-subtle transition hover:text-foreground"
          >
            <Icon icon={RiMailCheckLine} size={14} />
            {user.email}
          </a>
          {user.biography && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{user.biography}</p>
          )}
        </div>
      </section>

      {/* ── Proyectos ── */}
      <section>
        <SectionTitle>Proyectos</SectionTitle>
        {projects.length === 0 ? (
          <p className="text-sm text-subtle">Este usuario aún no ha añadido proyectos.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* ── Entradas publicadas ── */}
      <section>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Icon icon={RiQuillPenLine} size={14} />
            Entradas publicadas
          </span>
        </SectionTitle>
        {entries.length === 0 ? (
          <p className="text-sm text-subtle">Este usuario aún no ha publicado entradas.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}