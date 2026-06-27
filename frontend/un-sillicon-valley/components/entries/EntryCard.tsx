import Link from "next/link";

import { AFFILIATION_LABELS, type EntrySummary, formatPublishedDate } from "@/lib/types/entry";

type EntryCardProps = {
  entry: EntrySummary;
};

export function EntryCard({ entry }: EntryCardProps) {
  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-zinc-500">
        <span>{formatPublishedDate(entry.published_at)}</span>
        <span>{entry.view_count} vistas</span>
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-zinc-900">
        <Link href={`/entries/${entry.id}`} className="hover:text-emerald-800">
          {entry.title}
        </Link>
      </h2>
      <p className="text-sm text-zinc-600">
        Por <span className="font-medium text-zinc-800">{entry.author.full_name}</span>
        {" · "}
        {affiliation}
      </p>
    </article>
  );
}
