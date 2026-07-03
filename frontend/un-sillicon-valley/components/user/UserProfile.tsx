"use client";

import Link from "next/link";
import { Icon, RiImage2Line, RiMailCheckLine, RiQuillPenLine } from "@/components/icons";
import { AFFILIATION_LABELS, type UserAffiliation } from "@/lib/types/user";

// ─── Tipos temporales (reemplazar con los reales cuando exista el back) ────────

type Project = {
  id: number;
  title: string;
  description: string;
  url: string;
  image_url?: string;
};

type Entry = {
  id: number;
  title: string;
  excerpt: string;
  published_at: string;
};

type PublicUser = {
  id: number;
  full_name: string;
  email: string;
  affiliation: UserAffiliation;
  bio?: string;
  avatar_url?: string | null;
};

// ─── Datos mock ────────────────────────────────────────────────────────────────

const MOCK_USER: PublicUser = {
  id: 1,
  full_name: "María González Rodríguez",
  email: "mgonzalezr@unal.edu.co",
  affiliation: "student",
  bio: "Estudiante de Ingeniería de Sistemas apasionada por la IA y el diseño de productos digitales. Trabajo en proyectos de impacto social dentro de la comunidad universitaria.",
  avatar_url: null,
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Sistema de detección de plagio",
    description: "Herramienta basada en NLP para detectar similitudes en documentos académicos.",
    url: "https://github.com/ejemplo/plagio",
  },
  {
    id: 2,
    title: "App de movilidad universitaria",
    description: "Plataforma para coordinar rutas y carpooling entre estudiantes de la UNAL.",
    url: "https://movilidad-unal.vercel.app",
  },
];

const MOCK_ENTRIES: Entry[] = [
  {
    id: 1,
    title: "Cómo la IA está transformando la educación superior",
    excerpt: "Un análisis de las herramientas que están cambiando la forma en que aprendemos y enseñamos en las universidades.",
    published_at: "2025-03-12",
  },
  {
    id: 2,
    title: "El reto de la movilidad en los campus universitarios",
    excerpt: "Reflexiones sobre cómo mejorar el transporte dentro y entre sedes universitarias usando tecnología.",
    published_at: "2025-01-28",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Subcomponentes ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-subtle">
      {children}
    </h2>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-xl border border-border bg-background/30 p-4 transition hover:border-primary/40 hover:bg-background/60"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background/50">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-subtle">
            <Icon icon={RiImage2Line} size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {project.title}
        </p>
        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{project.description}</p>
        )}
        <p className="mt-1 truncate text-xs text-subtle">{project.url}</p>
      </div>
    </a>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Link
      href={`/entries/${entry.id}`}
      className="group flex flex-col gap-1 rounded-xl border border-border bg-background/30 p-4 transition hover:border-primary/40 hover:bg-background/60"
    >
      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
        {entry.title}
      </p>
      <p className="text-xs text-muted line-clamp-2">{entry.excerpt}</p>
      <p className="mt-1 text-xs text-subtle">{formatDate(entry.published_at)}</p>
    </Link>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function UserProfile() {
  // TODO: reemplazar con llamada real al back usando el id de la URL
  const user = MOCK_USER;
  const projects = MOCK_PROJECTS;
  const entries = MOCK_ENTRIES;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-6 py-10">

      {/* ── Cabecera del perfil ── */}
      <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
        {/* Avatar */}
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background/50">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted">
              {getInitial(user.full_name)}
            </div>
          )}
        </div>

        {/* Info principal */}
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
          {user.bio && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{user.bio}</p>
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