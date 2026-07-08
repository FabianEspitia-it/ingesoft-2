import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/comments/CommentSection";
import { EntryEditButton } from "@/components/entries/EntryEditButton";
import { MarkdownView } from "@/components/entries/MarkdownView";
import { ReactionBar } from "@/components/entries/ReactionBar";
import { Header } from "@/components/layout/Header";
import { getEntry } from "@/lib/api";
import { AFFILIATION_LABELS, formatPublishedDate } from "@/lib/types/entry";

type EntryDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Volver al inicio
          </Link>
          <EntryEditButton entryId={entry.id} authorId={entry.author.id} />
        </div>

        <article className="ds-card mt-6 p-8">
          {entry.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.cover_image_url}
              alt={`Portada de ${entry.title}`}
              className="mb-6 max-h-96 w-full rounded-2xl object-cover"
            />
          )}
          {entry.is_success_case && (
            <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              ⭐ Caso de éxito
            </span>
          )}
          <p className="text-sm text-subtle">{formatPublishedDate(entry.published_at)}</p>
          <h1 className="ds-headline mt-2 text-4xl text-foreground">{entry.title}</h1>

          <Link
            href={`/user/${entry.author.id}`}
            className="group mt-6 block rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 transition hover:border-accent/60 hover:bg-accent/15"
          >
            <p className="text-sm font-medium text-accent">Autor</p>
            <p className="mt-1 text-lg font-semibold text-foreground group-hover:underline">
              {entry.author.full_name}
            </p>
            <p className="text-sm text-muted">{affiliation}</p>
          </Link>

          <MarkdownView
            content={entry.body}
            className="mt-8 max-w-none text-base text-foreground/90"
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

          <p className="mt-8 text-sm text-subtle">{entry.view_count} vistas</p>

          <ReactionBar entryId={entry.id} />
        </article>

        <CommentSection entryId={entry.id} />
      </main>
    </div>
  );
}
