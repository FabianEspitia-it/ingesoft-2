"use client";
import { Suspense, useState } from "react";
import { Header } from "@/components/layout/Header";
import AdvancedSearch from "@/components/search/SearchForm";
import SearchResults from "@/components/search/SearchTerms";

export default function SearchPage() {
  const [disable, setDisable] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header variant="marketing" activePath="/register" disable={disable} />
      <div className="flex flex-1 overflow-hidden">
      <div className="w-85">
        <AdvancedSearch setDisable={setDisable} />
      </div>

      <div className="flex-1 overflow-auto">
        <SearchResults />
      </div>
    </div>
      <Suspense
        fallback={
          <main className="flex min-h-0 flex-1 items-center justify-center">
          </main>
          
        }
      >
      </Suspense>
    </div>
  );
}
