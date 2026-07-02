"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/Header";
import AdvancedSearch from "@/components/search/SearchForm";
import SearchResults from "@/components/search/SearchTerms";

function hasAdvancedSearchParams(searchParams: URLSearchParams): boolean {
  return ["title", "author", "tag"].some((key) => {
    const value = searchParams.get(key);
    return value !== null && value.trim().length > 0;
  });
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const disableHeaderSearch = hasAdvancedSearchParams(searchParams);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header variant="marketing" activePath="/register" disable={disableHeaderSearch} />
      <div className="flex min-h-0 flex-1">
        <div className="flex w-85 shrink-0 flex-col self-stretch border-r border-border bg-header">
          <div className="overflow-y-auto p-6 pt-8">
            <AdvancedSearch />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-8">
          <SearchResults />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <Header variant="marketing" activePath="/register" />
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-sm text-muted">Cargando búsqueda…</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
