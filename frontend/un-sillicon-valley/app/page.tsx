import { EntryCard } from "@/components/entries/EntryCard";
import { FeaturedHero } from "@/components/entries/FeaturedHero";
import { Header } from "@/components/layout/Header";
import { HomeSidebar } from "@/components/layout/HomeSidebar";
import { getEntries, getFeaturedEntries, getSuccessCases } from "@/lib/api";

export default async function HomePage() {
  let entries = null;
  let featured = null;
  let successCases = null;
  let loadError: string | null = null;

  try {
    [entries, featured, successCases] = await Promise.all([
      getEntries(),
      getFeaturedEntries(),
      getSuccessCases(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "No se pudieron cargar las entradas.";
  }

  const heroEntry = featured?.items[0] ?? null;
  const recentEntries = entries?.items ?? [];
  const totalEntries = entries?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Saltar al contenido principal
      </a>

      <Header activePath="/" />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loadError && (
          <div className="ds-alert ds-alert-warning mb-6" role="alert">
            {loadError}
          </div>
        )}

        {heroEntry && (
          <section aria-label="Entrada destacada" className="mb-10">
            <FeaturedHero entry={heroEntry} />
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <section aria-labelledby="recent-entries-heading">
            <header className="mb-5 flex items-baseline justify-between">
              <h1 id="recent-entries-heading" className="ds-headline text-xl">
                Entradas recientes
                {totalEntries > 0 && (
                  <span className="ml-2 text-sm font-normal text-subtle">
                    (orden descendente por fecha)
                  </span>
                )}
              </h1>
            </header>

            {recentEntries.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {recentEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} variant="compact" />
                ))}
              </div>
            ) : (
              !loadError && (
                <div className="ds-card border-dashed px-6 py-12 text-center">
                  <p className="text-muted">
                    Aún no hay entradas publicadas. Sé el primero en crear una.
                  </p>
                </div>
              )
            )}
          </section>

          <HomeSidebar successCases={successCases?.items ?? []} />
        </div>
      </main>
    </div>
  );
}
