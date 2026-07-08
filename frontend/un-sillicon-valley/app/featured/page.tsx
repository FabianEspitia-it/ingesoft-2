import Image from "next/image";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { getFeaturedEntries } from "@/lib/api";
import { AFFILIATION_LABELS } from "@/lib/types/entry";

function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

function formatMonth(): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function FeaturedPage() {
  let data = null;
  let loadError: string | null = null;

  try {
    data = await getFeaturedEntries();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "No se pudieron cargar las entradas destacadas.";
  }

  const items = data?.items ?? [];
  const totalLikes = items.reduce((sum, e) => sum + e.likes, 0);
  const totalComments = items.reduce((sum, e) => sum + e.comments_count, 0);
  const avgLikes = items.length > 0 ? Math.round(totalLikes / items.length) : 0;
  const avgComments = items.length > 0 ? Math.round(totalComments / items.length) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header variant="marketing" activePath="/destacados" />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="ds-headline text-3xl sm:text-4xl">
            <span aria-hidden="true">🔥</span>{" "}
            Destacados <em className="font-serif">del último mes</em>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Entradas que superan el promedio de likes y comentarios del último mes. Se actualiza diariamente.
          </p>

          {items.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-primary" aria-hidden="true"><path d="M4 2a2 2 0 0 0-2 2v1h12V4a2 2 0 0 0-2-2H4ZM2 8v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8H2Zm3 1a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2H5Z" /></svg>
                Promedio: {avgComments} comentarios · {avgLikes} likes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-accent" aria-hidden="true"><path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 7a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Zm0 3.5a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z" clipRule="evenodd" /></svg>
                {formatMonth()}
              </span>
            </div>
          )}
        </header>

        {loadError && (
          <div className="ds-alert ds-alert-warning mb-6" role="alert">{loadError}</div>
        )}

        {items.length > 0 ? (
          <ol className="grid gap-3" aria-label="Ranking de entradas destacadas">
            {items.map((entry, index) => {
              const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;
              const coverUrl = entry.cover_image_url;

              return (
                <li key={entry.id}>
                  <article className="ds-card group grid grid-cols-[auto_7rem_1fr_auto] items-center gap-4 p-4 transition-colors hover:border-primary/30 sm:grid-cols-[auto_9rem_1fr_auto]">
                    <span className="text-2xl font-bold text-subtle sm:text-3xl" aria-label={`Puesto ${index + 1}`}>
                      #{index + 1}
                    </span>

                    <div className="relative h-20 w-full overflow-hidden rounded-lg bg-border/20 sm:h-28">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt=""
                          fill
                          sizes="9rem"
                          className="object-cover"
                          loading={index < 3 ? "eager" : "lazy"}
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-subtle" aria-hidden="true">
                          img
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                        {entry.categories.length > 0 && (
                          <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-medium text-accent">
                            {entry.categories[0]}
                          </span>
                        )}
                        <time dateTime={entry.published_at} className="text-subtle">
                          {formatShortDate(entry.published_at)}
                        </time>
                      </div>
                      <h2 className="ds-headline line-clamp-2 text-base leading-snug sm:text-lg">
                        <Link
                          href={`/entries/${entry.id}`}
                          className="transition-colors hover:text-primary focus-visible:text-primary"
                        >
                          {entry.title}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-muted">
                        {entry.author.full_name} · {affiliation}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-xs text-subtle" aria-label="Métricas">
                      <span className="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path fillRule="evenodd" d="M1.38 8.28a.87.87 0 0 1 0-.56C2.6 5.12 5.06 3.5 8 3.5s5.4 1.62 6.62 4.22c.08.18.08.38 0 .56C13.4 10.88 10.94 12.5 8 12.5s-5.4-1.62-6.62-4.22ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" /></svg>
                        <span className="font-variant-numeric tabular-nums">{entry.view_count}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path fillRule="evenodd" d="M1 8.74v-3.5C1 3.45 2.46 2 4.24 2h7.52C13.54 2 15 3.45 15 5.24v3.5C15 10.55 13.54 12 11.76 12H9.6l-2.4 2.4a.5.5 0 0 1-.85-.35V12h-2.1C2.45 12 1 10.55 1 8.74Z" clipRule="evenodd" /></svg>
                        <span className="font-variant-numeric tabular-nums">{entry.comments_count}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M8.834 2.04a.75.75 0 0 0-1.078.26L5.833 5.75H3.5a1.75 1.75 0 0 0-1.75 1.75v3.5c0 .966.784 1.75 1.75 1.75h1.127a.75.75 0 0 0 .154.072l3.219 1.073a2.75 2.75 0 0 0 .874.143h1.876A2.75 2.75 0 0 0 13.5 11.29V7.5a2.75 2.75 0 0 0-1.593-2.494L10.47 4.28a.75.75 0 0 1-.38-.454l-.348-1.217a.75.75 0 0 0-.908-.569Z" /></svg>
                        <span className="font-variant-numeric tabular-nums">{entry.likes}</span>
                      </span>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          !loadError && (
            <div className="ds-card border-dashed px-6 py-12 text-center">
              <p className="text-muted">
                Aún no hay entradas que superen el umbral de popularidad este mes.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
