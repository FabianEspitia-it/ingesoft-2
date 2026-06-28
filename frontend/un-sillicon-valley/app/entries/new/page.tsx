import { EntryForm } from "@/components/entries/EntryForm";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Header } from "@/components/layout/Header";

export default function NewEntryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="mb-8">
          <h1 className="ds-headline text-3xl text-foreground">Crear una entrada</h1>
          <p className="mt-2 text-muted">
            Publica contenido para la comunidad. Debes tener sesión iniciada.
          </p>
        </section>

        <AuthGuard>
          <div className="ds-card p-8">
            <EntryForm />
          </div>
        </AuthGuard>
      </main>
    </div>
  );
}
