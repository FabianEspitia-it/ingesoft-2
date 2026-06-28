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
      {error && <div className="ds-alert ds-alert-error">{error}</div>}

      <div>
        <label htmlFor="title" className="ds-label">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="auth-input auth-input-compact"
          placeholder="Escribe el título de tu entrada"
        />
      </div>

      <div>
        <label htmlFor="body" className="ds-label">
          Contenido
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={12}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="auth-input auth-input-compact resize-y"
          placeholder="Escribe el contenido de tu entrada"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="ds-btn ds-btn-primary ds-btn-pill"
        >
          {isSubmitting ? "Publicando..." : "Publicar entrada"}
        </button>
      </div>
    </form>
  );
}
