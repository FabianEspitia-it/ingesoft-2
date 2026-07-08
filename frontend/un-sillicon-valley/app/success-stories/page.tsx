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
      <Header variant="marketing" activePath="/success-stories" />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="ds-headline text-3xl sm:text-4xl" style={{ textWrap: "balance" }}>
            Casos de éxito
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Entradas marcadas por administradores con la etiqueta especial &ldquo;Caso de éxito&rdquo;.
          </p>
        </header>

        {loadError && (
          <div className="ds-alert ds-alert-warning mb-6" role="alert">{loadError}</div>
        )}

        {entries && entries.items.length > 0 ? (
          <section aria-label="Lista de casos de éxito">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {entries.items.map((entry) => (
                <EntryCard key={entry.id} entry={entry} variant="compact" />
              ))}
            </div>
          </section>
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
