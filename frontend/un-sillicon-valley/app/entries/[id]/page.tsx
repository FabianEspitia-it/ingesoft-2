import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/comments/CommentSection";
import { EntryEditButton } from "@/components/entries/EntryEditButton";
import { MarkdownView } from "@/components/entries/MarkdownView";
import { ReactionBar } from "@/components/entries/ReactionBar";
import { Header } from "@/components/layout/Header";
import { getEntry, getUserById } from "@/lib/api";
import { AFFILIATION_LABELS } from "@/lib/types/entry";

type EntryDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatFullDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export default async function EntryDetailPage({ params }: EntryDetailPageProps) {
  const { id } = await params;
  const entryId = Number(id);

  if (Number.isNaN(entryId)) {
    notFound();
  }

  let entry = null;
  try {
    entry = await getEntry(entryId);
  } catch {
    notFound();
  }

  let authorProfile = null;
  try {
    authorProfile = await getUserById(entry.author.id);
  } catch {
    // Profile is optional for display
  }

  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;
  const initial = (entry.author.full_name.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          ← Volver al inicio
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <article className="ds-card p-8">
            {entry.is_success_case && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                ⭐ Caso de éxito
              </span>
            )}

            <h1 id="entry-title" className="ds-headline text-3xl leading-tight sm:text-4xl" style={{ textWrap: "balance" }}>
              {entry.title}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white" aria-hidden="true">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {entry.author.full_name} · {affiliation}
                </p>
                <p className="text-xs text-subtle">
                  <time dateTime={entry.published_at}>
                    Publicado {formatFullDate(entry.published_at)}
                  </time>
                  {entry.updated_at && (
                    <>
                      {" · editado "}
                      <time dateTime={entry.updated_at}>
                        {formatFullDate(entry.updated_at)}
                      </time>
                    </>
                  )}
                </p>
              </div>
              <div className="ml-auto">
                <EntryEditButton entryId={entry.id} authorId={entry.author.id} />
              </div>
            </div>

            {entry.cover_image_url && (
              <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl bg-border/20">
                <Image
                  src={entry.cover_image_url}
                  alt={`Portada de ${entry.title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-cover"
                  priority
                  fetchPriority="high"
                />
              </div>
            )}

            <MarkdownView
              content={entry.body}
              className="mt-8 max-w-none text-base leading-relaxed text-foreground/90"
            />

            {(entry.categories.length > 0 || entry.tags.length > 0) && (
              <div className="mt-8 flex flex-wrap gap-2">
                {entry.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {category}
                  </span>
                ))}
                {entry.tags.map((tag) => (
                  <span key={tag} className="ds-badge">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <footer className="mt-8 border-t border-border pt-6">
              <p className="text-sm text-subtle font-variant-numeric tabular-nums">
                {entry.view_count} vistas
              </p>
              <ReactionBar entryId={entry.id} />
            </footer>
          </article>

          <aside aria-label="Información del autor" className="hidden lg:block">
            <div className="ds-card sticky top-24 p-5 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white" aria-hidden="true">
                {initial}
              </span>
              <h2 className="mt-3 text-sm font-bold text-foreground">
                {entry.author.full_name}
              </h2>
              <p className="text-xs text-subtle">{affiliation}</p>
              {authorProfile?.biography && (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {authorProfile.biography}
                </p>
              )}
              <Link
                href={`/user/${entry.author.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:text-primary"
              >
                Ver perfil &rarr;
              </Link>
            </div>
          </aside>
        </div>

        <CommentSection entryId={entry.id} />
      </main>
    </div>
  );
}
