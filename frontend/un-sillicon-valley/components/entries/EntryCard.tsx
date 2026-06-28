import Link from "next/link";

import { AFFILIATION_LABELS, type EntrySummary, formatPublishedDate } from "@/lib/types/entry";

type EntryCardProps = {
  entry: EntrySummary;
};

export function EntryCard({ entry }: EntryCardProps) {
  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;

  return (
    <article className="ds-card group p-6 transition hover:border-accent/60">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-subtle">
        <span>{formatPublishedDate(entry.published_at)}</span>
        <span>{entry.view_count} vistas</span>
      </div>
      <h2 className="ds-headline mb-2 text-2xl">
        <Link
          href={`/entries/${entry.id}`}
          className="transition group-hover:text-accent"
        >
          {entry.title}
        </Link>
      </h2>
      <p className="text-sm text-muted">
        Por <span className="font-medium text-foreground">{entry.author.full_name}</span>
        {" · "}
        {affiliation}
      </p>
    </article>
  );
}
