"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createEntry } from "@/lib/api";

export function EntryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const entry = await createEntry({ title, body });
      router.push(`/entries/${entry.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la entrada.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-zinc-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-600"
          placeholder="Escribe el título de tu entrada"
        />
      </div>

      <div>
        <label htmlFor="body" className="mb-2 block text-sm font-medium text-zinc-700">
          Contenido
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={12}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-600"
          placeholder="Escribe el contenido de tu entrada"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Publicando..." : "Publicar entrada"}
        </button>
      </div>
    </form>
  );
}
