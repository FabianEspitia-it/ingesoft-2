import { EditEntryView } from "@/components/entries/EditEntryView";
import { Header } from "@/components/layout/Header";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="mb-8">
          <h1 className="ds-headline text-3xl text-foreground">Editar entrada</h1>
          <p className="mt-2 text-muted">Actualiza el contenido de tu publicación.</p>
        </section>

        <EditEntryView entryId={Number(id)} />
      </main>
    </div>
  );
}
