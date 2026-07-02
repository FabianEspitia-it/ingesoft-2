"use client";

import { memo, useEffect, useState } from "react";
import { TAG_LABELS, type EntryTag } from "@/lib/types/tags";
import { useRouter } from "next/navigation";
import { getSearch } from "@/lib/api";

const TAGS: EntryTag[] = ["Startups",
        "ProductoDigital",
        "Financiacion",
        "EquiposTech",
        "Marketing",
        "GoToMarket",
        "Growth"];


const TagPicker = memo(function TagPicker({
    value,
    onChange,
    }: {
      value: EntryTag;
      onChange: (value: EntryTag) => void;
    }) {
      return (
        <fieldset>
            <legend className="ds-label mb-2">
              Etiqueta <span className="text-[var(--error)]">*</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const isSelected = value === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onChange(tag)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "border-accent/60 bg-accent/15 text-foreground"
                        : "border-border bg-background/30 text-muted hover:border-primary/50 hover:text-foreground"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                );
              })}
            </div>
          </fieldset>
      );
    });

export default function AdvancedSearch({setDisable}){
    const router = useRouter();
    const searchParams = new URLSearchParams();
    
    const [tag, setTag] = useState<EntryTag>("Growth");
    const [title, setTitle] = useState("")
    const [author, setAuthor] = useState("")
    

    function handleSubmit(event: React.FormEvent<HTMLFormElement>){
        setDisable(true)
        event.preventDefault();
        if (title) searchParams.set("title", title);
        if (author)searchParams.set("author", author);
        searchParams.set("tag", tag);

        const query = searchParams.toString()
        router.push(`/search?${searchParams.toString()}`)
    }

    return (
        <aside className="w-80 border-r border-zinc-200 bg-white p-6">
    <form className="space-y-2" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="query" className="mb-2 block text-sm font-medium text-zinc-700">
                    Busqueda especializada
                </label>
            </div>
            <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-zinc-700">
                    Título
                </label>
                <input 
                  type="text" 
                  id="title" 
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-600" 
                  placeholder="Buscar" />
            </div>
            <div>
                <label htmlFor="author" className="mb-2 block text-sm font-medium text-zinc-700">
                    Autor
                </label>
                <input 
                type="text" 
                id="author" 
                name="author" 
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-emerald-600" 
                placeholder="Buscar"
                 />
            </div>
            <TagPicker value={tag} onChange={setTag} />
            <button type="submit" className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                Buscar
            </button>
        </form>
  </aside>
    );
}
