import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { getFeaturedEntries } from "@/lib/api";
import { AFFILIATION_LABELS, formatPublishedDate } from "@/lib/types/entry";

export default async function FeaturedPage() {
  let data = null;
  let loadError: string | null = null;

  try {
    data = await getFeaturedEntries();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "No se pudieron cargar las entradas destacadas.";
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="marketing" activePath="/destacados" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <p className="ds-eyebrow">Comunidad UNAL</p>
          <h1 className="ds-headline mt-2 text-4xl sm:text-5xl">Entradas Destacadas</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Las publicaciones con mayor interacción de la comunidad en el último mes.
          </p>
        </section>

        {loadError && <div className="ds-alert ds-alert-warning mb-6">{loadError}</div>}

        <section className="space-y-5">
          {data && data.items.length > 0 ? (
            <div className="grid gap-5">
              {data.items.map((entry) => {
                const affiliation =
                  AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;
                return (
                  <article
                    key={entry.id}
                    className="ds-card group p-6 transition hover:border-primary/30"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4 text-sm text-subtle">
                      <span>{formatPublishedDate(entry.published_at)}</span>
                      <div className="flex items-center gap-3">
                        <span className="featured-metric">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-primary">
                            <path d="M1 8.998a7 7 0 1 1 14 0 7 7 0 0 1-14 0Zm7.7-3.697a.75.75 0 0 0-1.4 0l-.975 2.534H3.622a.75.75 0 0 0-.467 1.338l2.095 1.59-.845 2.5a.75.75 0 0 0 1.17.836L8 12.347l2.425 1.752a.75.75 0 0 0 1.17-.836l-.845-2.5 2.095-1.59a.75.75 0 0 0-.467-1.338H9.675L8.7 5.301Z" />
                          </svg>
                          {entry.likes} likes
                        </span>
                        <span className="featured-metric">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
                            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 0 0 1.33 0l1.713-3.293a.783.783 0 0 1 .642-.413 41.102 41.102 0 0 0 3.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2ZM6.75 6a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 2.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" clipRule="evenodd" />
                          </svg>
                          {entry.comments_count} comentarios
                        </span>
                        <span>{entry.view_count} vistas</span>
                      </div>
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
                      Por{" "}
                      <span className="font-medium text-foreground">
                        {entry.author.full_name}
                      </span>
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
                  </article>
                );
              })}
            </div>
          ) : (
            !loadError && (
              <div className="ds-card border-dashed px-6 py-12 text-center">
                <p className="text-muted">
                  Aún no hay entradas que superen el umbral de popularidad este mes.
                </p>
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}
