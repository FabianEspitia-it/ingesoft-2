import { EntryForm } from "../entries/EntryForm";
import { getAllEntries } from "@/lib/api";
import { EntryListResponse } from "@/lib/types/entry";
import { useEffect, useState } from "react";
import { EntryCard } from "../entries/EntryCard";


export default function HomeView() {
  let loadError: string | null = null;
  const [results, setResults] = useState<EntryListResponse | null>(null);

  useEffect(() =>{
  async function fetchEntriesData() {
        try{
          const entries = await getAllEntries()
          setResults(entries);
        } catch (error){
          console.log("error")
        }
      }

  fetchEntriesData()
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Entradas Admin</h1>
      <p className="text-muted">
        Bienvenido de vuelta. Aquí puedes poner un resumen, estadísticas,
        accesos rápidos, etc.
      </p>
      <section className="space-y-6">
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
                  No se encontraron entradas.
                </p>
              </div>
            )
          )}
        </section>
    </div>
    
    
  );
}