"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RichTextEditor } from "@/components/entries/RichTextEditor";
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
  const [isDragging, setIsDragging] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(entry?.categories ?? []);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
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

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function addTag(raw: string) {
    const name = raw.trim().replace(/,$/, "").trim();
    if (!name) return;
    setTags((current) =>
      current.some((tag) => tag.toLowerCase() === name.toLowerCase())
        ? current
        : [...current, name],
    );
    setTagInput("");
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((current) => current.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  async function uploadFile(file: File) {
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

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function removeCoverImage() {
    setCoverImagePath("");
    setCoverImagePreview("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !body.trim()) {
      setError("El título y el cuerpo son obligatorios.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Elige al menos una categoría.");
      return;
    }

    // Fold the half-typed tag into the list so it isn't lost on submit.
    const finalTags = tagInput.trim() ? Array.from(new Set([...tags, tagInput.trim()])) : tags;

    setIsSubmitting(true);
    try {
      const saved = isEdit
        ? await updateEntry(entry.id, {
            title,
            body,
            cover_image: coverImagePath,
            category_names: selectedCategories,
            tags: finalTags,
          })
        : await createEntry({
            title,
            body,
            cover_image: coverImagePath || null,
            category_names: selectedCategories,
            tags: finalTags,
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

  const submitLabel = isSubmitting
    ? isEdit
      ? "Guardando..."
      : "Publicando..."
    : isEdit
      ? "Guardar cambios"
      : "Publicar";

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="text-sm text-subtle">
            <Link href="/" className="hover:text-primary hover:underline">
              Mis publicaciones
            </Link>
            <span className="mx-1.5">›</span>
            <span>{isEdit ? "Editar entrada" : "Nueva entrada"}</span>
          </nav>
          <h1 className="ds-headline mt-1 text-3xl text-foreground">
            {isEdit ? "Editar entrada" : "Crear nueva entrada"}
          </h1>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="ds-btn ds-btn-primary ds-btn-pill"
        >
          {submitLabel}
        </button>
      </div>

      {error && <div className="ds-alert ds-alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Editor */}
        <section className="ds-card p-6">
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border-none bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-subtle"
            placeholder="Título de tu entrada…"
          />

          <RichTextEditor
            value={entry?.body ?? ""}
            onChange={setBody}
            placeholder="Empieza a escribir aquí… Texto enriquecido con encabezados, listas, enlaces e imágenes."
          />
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Cover image */}
          <div className="ds-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Imagen de portada</h2>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-3 rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {coverImagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImagePreview}
                    alt="Vista previa de la portada"
                    className="mb-3 max-h-40 w-full rounded-xl object-cover"
                  />
                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                      {isUploading ? "Subiendo…" : "Cambiar"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageChange}
                        disabled={isUploading}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="text-sm font-medium text-subtle hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 py-4">
                  <CameraIcon />
                  <span className="text-sm font-medium text-foreground">
                    {isUploading ? "Subiendo…" : "Arrastra o haz clic para subir"}
                  </span>
                  <span className="text-xs text-subtle">JPG o PNG · máx 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    disabled={isUploading}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="ds-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Categoría <span className="text-accent">*</span>
            </h2>
            <p className="mt-0.5 text-xs text-subtle">Al menos una del catálogo</p>
            <div className="mt-3 flex flex-wrap gap-2">
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
                    {selected ? "✓ " : ""}
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free tags */}
          <div className="ds-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Etiquetas libres</h2>
            <p className="mt-0.5 text-xs text-subtle">Sepáralas por comas</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Quitar ${tag}`}
                    className="text-subtle hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
                className="min-w-[6rem] flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
                placeholder="añadir…"
              />
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-dashed border-border p-5">
            <p className="text-sm font-semibold text-foreground">💡 Tips de buena entrada</p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <li>· Mínimo título + cuerpo</li>
              <li>· Al menos 1 categoría</li>
              <li>· Imagen ≤ 5MB</li>
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-subtle"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
