import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { getEntry } from "@/lib/api";
import { AFFILIATION_LABELS, formatPublishedDate } from "@/lib/types/entry";

type EntryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EntryDetailPage({ params }: EntryDetailPageProps) {
  const { id } = await params;
  const entryId = Number(id);

  if (Number.isNaN(entryId)) {
    notFound();
  }

  let entry = null;
  try {
    entry = await getEntry(entryId);
  } catch {
    notFound();
  }

  const affiliation = AFFILIATION_LABELS[entry.author.affiliation] ?? entry.author.affiliation;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Volver al inicio
        </Link>

        <article className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-zinc-500">{formatPublishedDate(entry.published_at)}</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-900">{entry.title}</h1>

          <div className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4">
            <p className="text-sm font-medium text-emerald-900">Autor</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{entry.author.full_name}</p>
            <p className="text-sm text-zinc-600">{affiliation}</p>
          </div>

          <div className="prose prose-zinc mt-8 max-w-none whitespace-pre-wrap text-base leading-8 text-zinc-800">
            {entry.body}
          </div>

          <p className="mt-8 text-sm text-zinc-500">{entry.view_count} vistas</p>
        </article>
      </main>
    </div>
  );
}
