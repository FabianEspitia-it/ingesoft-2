import { EntryForm } from "@/components/entries/EntryForm";
import { Header } from "@/components/layout/Header";

export default function NewEntryPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Crear una entrada</h1>
          <p className="mt-2 text-zinc-600">
            Publica contenido para la comunidad. Debes tener sesión iniciada.
          </p>
        </section>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <EntryForm />
        </div>
      </main>
    </div>
  );
}
