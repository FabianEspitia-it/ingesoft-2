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
      <main className="mx-auto max-w-6xl px-6 py-8">
        <EditEntryView entryId={Number(id)} />
      </main>
    </div>
  );
}
