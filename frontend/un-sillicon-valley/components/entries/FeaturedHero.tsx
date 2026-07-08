import Image from "next/image";
import Link from "next/link";

import { AFFILIATION_LABELS, type FeaturedEntrySummary } from "@/lib/types/entry";

type FeaturedHeroProps = {
  entry: FeaturedEntrySummary;
};

function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function FeaturedHero({ entry }: FeaturedHeroProps) {
  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;
  const coverUrl = entry.cover_image_url;

  return (
    <article className="ds-card group grid gap-0 overflow-hidden transition-colors hover:border-primary/30 md:grid-cols-[2fr_3fr]">
      <div className="relative aspect-4/3 w-full bg-border/20 md:aspect-auto md:min-h-72">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
            priority
            fetchPriority="high"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-sm text-subtle" aria-hidden="true">
            portada destacada
          </span>
        )}
      </div>

      <div className="flex flex-col justify-center p-6 md:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            🔥 Destacado
          </span>
          {entry.categories.length > 0 && (
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {entry.categories[0]}
            </span>
          )}
        </div>

        <h2 className="ds-headline mb-3 text-2xl leading-tight md:text-3xl" style={{ textWrap: "balance" }}>
          <Link
            href={`/entries/${entry.id}`}
            className="transition-colors group-hover:text-primary focus-visible:text-primary"
          >
            {entry.title}
          </Link>
        </h2>

        <p className="mb-4 text-sm text-muted">
          {entry.author.full_name} &middot; {affiliation} &middot;{" "}
          <time dateTime={entry.published_at}>{formatShortDate(entry.published_at)}</time>
        </p>

        <Link
          href={`/entries/${entry.id}`}
          className="ds-btn ds-btn-ghost ds-btn-pill mt-auto w-fit px-5 py-2 text-sm"
        >
          Leer entrada &rarr;
        </Link>
      </div>
    </article>
  );
}
