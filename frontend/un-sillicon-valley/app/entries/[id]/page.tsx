import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/comments/CommentSection";
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
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          ← Volver al inicio
        </Link>

        <article className="ds-card mt-6 p-8">
          <p className="text-sm text-subtle">{formatPublishedDate(entry.published_at)}</p>
          <h1 className="ds-headline mt-2 text-4xl text-foreground">{entry.title}</h1>

          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4">
            <p className="text-sm font-medium text-accent">Autor</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{entry.author.full_name}</p>
            <p className="text-sm text-muted">{affiliation}</p>
          </div>

          <div className="mt-8 max-w-none whitespace-pre-wrap text-base leading-8 text-foreground/90">
            {entry.body}
          </div>

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
        </article>

        <CommentSection entryId={entry.id} />
      </main>
    </div>
  );
}
