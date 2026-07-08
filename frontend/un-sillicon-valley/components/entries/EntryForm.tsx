"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createEntry, getCategories, updateEntry, uploadCoverImage } from "@/lib/api";
import type { EntryDetail } from "@/lib/types/entry";

type EntryFormProps = {
  entry?: EntryDetail;
};

const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_COVER_IMAGE_TYPES = ["image/jpeg", "image/png"];

export function EntryForm({ entry }: EntryFormProps) {
  const router = useRouter();
  const isEdit = entry !== undefined;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  // Path is what we persist (cover_image); preview is a signed URL to display.
  const [coverImagePath, setCoverImagePath] = useState(entry?.cover_image ?? "");
  const [coverImagePreview, setCoverImagePreview] = useState(entry?.cover_image_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(entry?.categories ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((categories) => {
        if (!cancelled) setAvailableCategories(categories);
      })
      .catch(() => {
        // Categories are optional; ignore load errors silently.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file later by clearing the input value.
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!ALLOWED_COVER_IMAGE_TYPES.includes(file.type)) {
      setError("La imagen debe ser JPG o PNG.");
      return;
    }
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      setError("La imagen no debe superar 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { path, url } = await uploadCoverImage(file);
      setCoverImagePath(path);
      setCoverImagePreview(url ?? "");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  }

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const saved = isEdit
        ? await updateEntry(entry.id, {
            title,
            body,
            cover_image: coverImagePath,
            category_names: selectedCategories,
          })
        : await createEntry({
            title,
            body,
            cover_image: coverImagePath || null,
            category_names: selectedCategories,
          });
      router.push(`/entries/${saved.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEdit
            ? "No se pudo guardar la entrada."
            : "No se pudo crear la entrada.",
      );
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

      <div>
        <span className="ds-label">Imagen de portada</span>
        <p className="mb-2 text-sm text-subtle">Opcional. JPG o PNG, máximo 5MB.</p>

        {coverImagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImagePreview}
            alt="Vista previa de la portada"
            className="mb-3 max-h-64 w-full rounded-2xl border border-accent/20 object-cover"
          />
        )}

        <div className="flex items-center gap-3">
          <label className="ds-btn ds-btn-ghost ds-btn-pill cursor-pointer">
            {isUploading ? "Subiendo..." : coverImagePath ? "Cambiar imagen" : "Subir imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              disabled={isUploading}
              className="sr-only"
            />
          </label>
          {coverImagePath && !isUploading && (
            <button
              type="button"
              onClick={() => {
                setCoverImagePath("");
                setCoverImagePreview("");
              }}
              className="text-sm font-medium text-subtle hover:underline"
            >
              Quitar imagen
            </button>
          )}
        </div>
      </div>

      {availableCategories.length > 0 && (
        <div>
          <span className="ds-label">Categorías</span>
          <p className="mb-2 text-sm text-subtle">Elige una o más (opcional).</p>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => {
              const selected = selectedCategories.includes(category);
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => toggleCategory(category)}
                  aria-pressed={selected}
                  className={`ds-btn ds-btn-pill px-3 py-1.5 text-sm ${
                    selected ? "ds-btn-primary" : "ds-btn-ghost"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="ds-btn ds-btn-primary ds-btn-pill"
        >
          {isSubmitting
            ? isEdit
              ? "Guardando..."
              : "Publicando..."
            : isEdit
              ? "Guardar cambios"
              : "Publicar entrada"}
        </button>
      </div>
    </form>
  );
}
