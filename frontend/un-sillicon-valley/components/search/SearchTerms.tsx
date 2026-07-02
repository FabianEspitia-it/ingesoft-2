import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSearch } from "@/lib/api";
import { EntryCard } from "../entries/EntryCard";
import { EntryListResponse } from "@/lib/types/entry";

export default function SearchResults(){
    let loadError: string | null = null;
    const searchTerms = useSearchParams();
    const query = searchTerms.toString()

    const [results, setResults] = useState<EntryListResponse | null>(null);

    useEffect(() => {
    async function fetchData() {
      try{
        const entries = await getSearch(query)
        setResults(entries);
      } catch (error){
        console.log("error")
      }
    }

    fetchData();
    }, [query]);

    return (
        <section className="space-y-6">
          <h2 className="ds-headline text-2xl">Resultados de busqueda</h2>
          {results && results.items.length > 0 ? (
            <div className="grid gap-4">
              {results.items.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            !loadError && (
              <div className="ds-card border-dashed px-6 py-12 text-center">
                <p className="text-muted">
                  No se encontraron entradas. Sé el primero en crear una.
                </p>
              </div>
            )
          )}
        </section>
);
}