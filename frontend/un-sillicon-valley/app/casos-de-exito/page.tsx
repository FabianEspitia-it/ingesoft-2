import { EntryCard } from "@/components/entries/EntryCard";
import { Header } from "@/components/layout/Header";
import { getSuccessCases } from "@/lib/api";

export default async function SuccessCasesPage() {
  let entries = null;
  let loadError: string | null = null;

  try {
    entries = await getSuccessCases();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "No se pudieron cargar los casos de éxito.";
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="marketing" activePath="/casos-de-exito" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-10">
          <p className="ds-eyebrow">Destacados por administradores</p>
          <h1 className="ds-headline mt-2 text-4xl sm:text-5xl">Casos de éxito</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Entradas marcadas por administradores con la etiqueta especial &ldquo;Caso de
            éxito&rdquo;.
          </p>
        </section>

        {loadError && <div className="ds-alert ds-alert-warning mb-6">{loadError}</div>}

        {entries && entries.items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.items.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          !loadError && (
            <div className="ds-card border-dashed px-6 py-12 text-center">
              <p className="text-muted">Aún no hay casos de éxito destacados.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
