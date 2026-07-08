import Image from "next/image";
import Link from "next/link";

import { AFFILIATION_LABELS, type EntrySummary, type FeaturedEntrySummary } from "@/lib/types/entry";

type EntryCardProps = {
  entry: EntrySummary | FeaturedEntrySummary;
  variant?: "default" | "compact" | "horizontal";
};

function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

function MetricsRow({ entry }: { entry: EntrySummary | FeaturedEntrySummary }) {
  return (
    <div className="flex items-center gap-3 text-xs text-subtle">
      <span className="inline-flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path fillRule="evenodd" d="M1.38 8.28a.87.87 0 0 1 0-.56C2.6 5.12 5.06 3.5 8 3.5s5.4 1.62 6.62 4.22c.08.18.08.38 0 .56C13.4 10.88 10.94 12.5 8 12.5s-5.4-1.62-6.62-4.22ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd"/></svg>
        <span className="font-variant-numeric tabular-nums">{entry.view_count}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path fillRule="evenodd" d="M1 8.74v-3.5C1 3.45 2.46 2 4.24 2h7.52C13.54 2 15 3.45 15 5.24v3.5C15 10.55 13.54 12 11.76 12H9.6l-2.4 2.4a.5.5 0 0 1-.85-.35V12h-2.1C2.45 12 1 10.55 1 8.74Z" clipRule="evenodd"/></svg>
        <span className="font-variant-numeric tabular-nums">{entry.comments_count}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M8.834 2.04a.75.75 0 0 0-1.078.26L5.833 5.75H3.5a1.75 1.75 0 0 0-1.75 1.75v3.5c0 .966.784 1.75 1.75 1.75h1.127a.75.75 0 0 0 .154.072l3.219 1.073a2.75 2.75 0 0 0 .874.143h1.876A2.75 2.75 0 0 0 13.5 11.29V7.5a2.75 2.75 0 0 0-1.593-2.494L10.47 4.28a.75.75 0 0 1-.38-.454l-.348-1.217a.75.75 0 0 0-.908-.569Z"/></svg>
        <span className="font-variant-numeric tabular-nums">{entry.likes}</span>
      </span>
    </div>
  );
}

export function EntryCard({ entry, variant = "default" }: EntryCardProps) {
  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;
  const coverUrl = entry.cover_image_url ?? null;

  if (variant === "horizontal") {
    return (
      <article className="ds-card group grid grid-cols-[7.5rem_1fr] overflow-hidden transition-colors hover:border-primary/30 sm:grid-cols-[9rem_1fr]">
        <div className="relative min-h-28 w-full bg-border/20">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="9rem"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-subtle" aria-hidden="true">
              img
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {entry.categories.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-medium text-accent">
                {entry.categories[0]}
              </span>
            )}
            <time dateTime={entry.published_at} className="text-subtle">
              {formatShortDate(entry.published_at)}
            </time>
          </div>
          <h3 className="ds-headline line-clamp-2 text-base leading-snug sm:text-lg">
            <Link href={`/entries/${entry.id}`} className="transition-colors hover:text-primary focus-visible:text-primary">
              {entry.title}
            </Link>
          </h3>
          <p className="text-xs text-muted">
            {entry.author.full_name} &middot; {affiliation}
          </p>
          <div className="mt-auto pt-1">
            <MetricsRow entry={entry} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    const isSuccessCase = "is_success_case" in entry && entry.is_success_case;

    return (
      <article className="ds-card group flex flex-col overflow-hidden transition-colors hover:border-primary/30">
        <div className="relative aspect-video w-full bg-border/20">
          {isSuccessCase && (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              ⭐ Caso de éxito
            </span>
          )}
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-sm text-subtle" aria-hidden="true">
              portada
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            {entry.categories.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-medium text-accent">
                {entry.categories[0]}
              </span>
            )}
            <time dateTime={entry.published_at} className="text-subtle">
              {formatShortDate(entry.published_at)}
            </time>
          </div>
          <h3 className="ds-headline mb-2 line-clamp-2 text-base leading-snug">
            <Link href={`/entries/${entry.id}`} className="transition-colors hover:text-primary focus-visible:text-primary">
              {entry.title}
            </Link>
          </h3>
          <p className="mt-auto text-xs text-muted">
            {entry.author.full_name} &middot; {affiliation}
          </p>
          <div className="mt-2">
            <MetricsRow entry={entry} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="ds-card group p-6 transition-colors hover:border-primary/30">
      {"is_success_case" in entry && entry.is_success_case && (
        <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          ⭐ Caso de éxito
        </span>
      )}
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-subtle">
        <time dateTime={entry.published_at}>{formatShortDate(entry.published_at)}</time>
        <span className="font-variant-numeric tabular-nums">{entry.view_count} vistas</span>
      </div>
      <h2 className="ds-headline mb-2 text-2xl">
        <Link href={`/entries/${entry.id}`} className="transition-colors group-hover:text-primary focus-visible:text-primary">
          {entry.title}
        </Link>
      </h2>
      <p className="text-sm text-muted">
        Por <span className="font-medium text-foreground">{entry.author.full_name}</span>
        {" \u00b7 "}
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
    </article>
  );
}
