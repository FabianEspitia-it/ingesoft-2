import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSearch } from "@/lib/api";
import { EntryCard } from "../entries/EntryCard";
import type { EntryListResponse } from "@/lib/types/entry";

export default function SearchResults() {
  const searchTerms = useSearchParams();
  const query = searchTerms.toString();
  const displayQuery = searchTerms.get("title") || searchTerms.get("terms") || searchTerms.get("tag") || "";

  const [results, setResults] = useState<EntryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!!query);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setResults(null);

    async function fetchData() {
      try {
        const entries = await getSearch(query);
        if (!cancelled) setResults(entries);
      } catch {
        if (!cancelled) setError("No se pudieron cargar los resultados.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <section aria-labelledby="search-results-heading" className="space-y-5">
      <header>
        <p className="text-xs text-subtle">
          Resultados de búsqueda
          {results && ` \u00b7 ${results.total} entrada${results.total !== 1 ? "s" : ""}`}
        </p>
        {displayQuery && (
          <h1 id="search-results-heading" className="ds-headline mt-1 text-2xl sm:text-3xl">
            &ldquo;{displayQuery}&rdquo;
          </h1>
        )}
        {!displayQuery && (
          <h1 id="search-results-heading" className="ds-headline mt-1 text-2xl">
            Resultados de búsqueda
          </h1>
        )}
      </header>

      {error && (
        <div className="ds-alert ds-alert-warning" role="alert">{error}</div>
      )}

      {isLoading && (
        <p className="text-sm text-muted" aria-live="polite">Buscando…</p>
      )}

      {!isLoading && results && results.items.length > 0 && (
        <div className="grid gap-4">
          {results.items.map((entry) => (
            <EntryCard key={entry.id} entry={entry} variant="horizontal" />
          ))}
        </div>
      )}

      {!isLoading && results && results.items.length === 0 && (
        <div className="ds-card border-dashed px-6 py-12 text-center">
          <p className="text-muted">
            No se encontraron entradas para esta búsqueda.
          </p>
        </div>
      )}

      {!isLoading && !results && !error && !query && (
        <div className="ds-card border-dashed px-6 py-12 text-center">
          <p className="text-muted">
            Usa los filtros de la izquierda para buscar entradas.
          </p>
        </div>
      )}
    </section>
  );
}