import { EntryCard } from "@/components/entries/EntryCard";
import { Header } from "@/components/layout/Header";
import { getEntries } from "@/lib/api";

export default async function HomePage() {
  let entries = null;
  let loadError: string | null = null;

  try {
    entries = await getEntries();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "No se pudieron cargar las entradas.";
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activePath="/"/>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <p className="ds-eyebrow">Comunidad UNAL</p>
          <h1 className="ds-headline mt-2 text-4xl sm:text-5xl">Blog UN Silicon Valley</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Emprendimiento, startups e ingeniería de software desde la comunidad UNAL.
          </p>
        </section>

        {loadError && <div className="ds-alert ds-alert-warning mb-6">{loadError}</div>}

        <section className="space-y-5">
          <h2 className="ds-headline text-2xl">Últimas entradas</h2>

          {entries && entries.items.length > 0 ? (
            <div className="grid gap-5">
              {entries.items.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
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
      </main>
    </div>
  );
}
