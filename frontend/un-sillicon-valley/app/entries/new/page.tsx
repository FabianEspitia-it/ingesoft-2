import { AuthGuard } from "@/components/auth/AuthGuard";
import { EntryForm } from "@/components/entries/EntryForm";
import { Header } from "@/components/layout/Header";

export default function NewEntryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <AuthGuard>
          <EntryForm />
        </AuthGuard>
      </main>
    </div>
  );
}
