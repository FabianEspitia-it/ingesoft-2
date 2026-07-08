"use client";

import { memo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Icon, RiCloseLine } from "@/components/icons";
import { getCategories } from "@/lib/api";

const INPUT_CLASS = "auth-input auth-input-compact";
const TAG_BUTTON_CLASS =
  "rounded-full border px-3.5 py-1.5 text-sm transition-[border-color,background-color,color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2";

const CategoryPicker = memo(function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <fieldset>
      <legend className="ds-label mb-2">
        Categoría <span className="font-normal text-subtle">(opcional)</span>
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías de búsqueda">
        {categories.map((category) => {
          const isSelected = value === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(isSelected ? null : category)}
              className={`${TAG_BUTTON_CLASS} ${
                isSelected
                  ? "border-primary bg-primary text-[var(--on-primary)]"
                  : "border-border bg-transparent text-muted hover:border-primary/40 hover:text-foreground"
              }`}
              aria-pressed={isSelected}
            >
              {category}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
});

export default function AdvancedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((available) => {
        if (!cancelled) setCategories(available);
      })
      .catch(() => {
        // Categories are optional; ignore load errors silently.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTitle(searchParams.get("title") ?? "");
    setAuthor(searchParams.get("author") ?? "");
    setCategory(searchParams.get("tag"));
  }, [searchParams]);

  const hasActiveFilters =
    title.trim().length > 0 || author.trim().length > 0 || category !== null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();

    if (trimmedTitle) params.set("title", trimmedTitle);
    if (trimmedAuthor) params.set("author", trimmedAuthor);
    if (category) params.set("tag", category);

    const query = params.toString();
    router.push(query ? `/search?${query}` : "/search");
  }

  function handleClear() {
    setTitle("");
    setAuthor("");
    setCategory(null);
    router.push("/search");
  }

  return (
    <aside className="w-full min-w-0">
      <form className="space-y-5" onSubmit={handleSubmit} aria-labelledby="search-form-title">
        <h2 id="search-form-title" className="ds-headline text-pretty text-xl">
          Búsqueda especializada
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="search-title" className="ds-label">
              Título
            </label>
            <input
              type="search"
              id="search-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={INPUT_CLASS}
              placeholder="Buscar…"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="search-author" className="ds-label">
              Autor
            </label>
            <input
              type="search"
              id="search-author"
              name="author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              className={INPUT_CLASS}
              placeholder="Buscar…"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <CategoryPicker categories={categories} value={category} onChange={setCategory} />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="ds-btn ds-btn-primary ds-btn-pill min-w-0 flex-1">
            Buscar
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-[border-color,color,background-color] duration-200 hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <Icon icon={RiCloseLine} size={18} />
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
