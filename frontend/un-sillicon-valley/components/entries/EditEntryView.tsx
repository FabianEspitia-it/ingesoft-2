"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EntryForm } from "@/components/entries/EntryForm";
import { getCurrentUser, getEntry } from "@/lib/api";
import type { EntryDetail } from "@/lib/types/entry";

type EditEntryViewProps = {
  entryId: number;
};

export function EditEntryView({ entryId }: EditEntryViewProps) {
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(entryId)) {
        if (!cancelled) setStatus("error");
        return;
      }

      try {
        const [user, entryData] = await Promise.all([getCurrentUser(), getEntry(entryId)]);
        if (cancelled) return;

        if (!user) {
          router.replace(`/login?next=/entries/${entryId}/edit`);
          return;
        }

        const canManage = user.id === entryData.author.id || user.role === "administrator";
        if (!canManage) {
          setStatus("denied");
          return;
        }

        setEntry(entryData);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [entryId, router]);

  if (status === "loading") {
    return <p className="ds-card px-4 py-3 text-sm text-muted">Cargando entrada...</p>;
  }

  if (status === "denied") {
    return (
      <div className="ds-card px-6 py-12 text-center">
        <p className="text-muted">No tienes permiso para editar esta entrada.</p>
      </div>
    );
  }

  if (status === "error" || !entry) {
    return (
      <div className="ds-card px-6 py-12 text-center">
        <p className="text-muted">No se pudo cargar la entrada.</p>
      </div>
    );
  }

  return <EntryForm entry={entry} />;
}
