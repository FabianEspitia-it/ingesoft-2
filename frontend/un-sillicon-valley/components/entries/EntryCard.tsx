"use client"
import Link from "next/link";

import { AFFILIATION_LABELS, type EntrySummary, formatPublishedDate } from "@/lib/types/entry";
import { getCurrentUser } from "@/lib/api";
import { useEffect, useState } from "react";
import { deleteEntry } from "@/lib/api";

type EntryCardProps = {
  entry: EntrySummary;
};

export function EntryCard({ entry }: EntryCardProps) {
  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;
  const [isDeletable, setIsDeletable] = useState(false)
  const [loading, setLoading] = useState(true);

  useEffect(() =>{
    async function checkDeletable(){
      const currentUser = await getCurrentUser()

      const segments = window.location.pathname
        .split("/")
        .filter(Boolean)

      if ((segments[0] == "user" && 
          segments[1] == currentUser?.id.toString()) ||
          segments[0] == "admin")
          setIsDeletable(true)
          setLoading(false)
    }

    checkDeletable()
    }, []);

    async function handleDeleteEntry(){
    await deleteEntry(entry.id)
    location.reload();
    }

  return (
    <article className="ds-card group p-6 transition hover:border-primary/30">
      {entry.is_success_case && (
        <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          ⭐ Caso de éxito
        </span>
      )}
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-subtle">
        <span>{formatPublishedDate(entry.published_at)}</span>
        <span>{entry.view_count} vistas</span>
      </div>
      <h2 className="ds-headline mb-2 text-2xl">
        <Link
          href={`/entries/${entry.id}`}
          className="transition group-hover:text-primary"
        >
          {entry.title}
        </Link>
      </h2>
      <p className="text-sm text-muted">
        Por <span className="font-medium text-foreground">{entry.author.full_name}</span>
        {" · "}
        {affiliation}
      </p>

      {entry.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.categories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
            >
              {category}
            </span>
          ))}
        </div>
      )}
      {isDeletable && (<div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" className="ds-btn ds-btn-primary ds-btn-pill min-w-0 flex-1" onClick={handleDeleteEntry}>
            Borrar
          </button>
        </div>)}
    </article>
  );
}
