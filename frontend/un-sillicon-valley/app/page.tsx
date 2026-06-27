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
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <h1 className="text-4xl font-bold text-zinc-900">Blog UN Silicon Valley</h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600">
            Emprendimiento, startups e ingeniería de software desde la comunidad UNAL.
          </p>
        </section>

        {loadError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {loadError}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">Últimas entradas</h2>

          {entries && entries.items.length > 0 ? (
            <div className="grid gap-4">
              {entries.items.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            !loadError && (
              <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center text-zinc-500">
                Aún no hay entradas publicadas. Sé el primero en crear una.
              </p>
            )
          )}
        </section>
      </main>
    </div>
  );
}
