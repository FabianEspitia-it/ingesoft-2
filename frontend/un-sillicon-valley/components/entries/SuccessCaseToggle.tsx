"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser, setSuccessCase } from "@/lib/api";

type SuccessCaseToggleProps = {
  entryId: number;
  initialValue: boolean;
};

export function SuccessCaseToggle({ entryId, initialValue }: SuccessCaseToggleProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((user) => {
      if (!cancelled) setIsAdmin(user?.role === "administrator");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) return null;

  async function handleToggle() {
    setIsPending(true);
    setError(null);
    try {
      const updated = await setSuccessCase(entryId, !value);
      setValue(updated.is_success_case);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el caso de éxito.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-4">
      <p className="text-sm font-medium text-subtle">Administración</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`ds-btn ds-btn-pill px-4 py-2 text-sm ${
            value ? "ds-btn-ghost" : "ds-btn-primary"
          }`}
        >
          {isPending
            ? "Guardando…"
            : value
              ? "Quitar de casos de éxito"
              : "⭐ Destacar como caso de éxito"}
        </button>
        {value && (
          <span className="text-sm text-muted">Esta entrada aparece en Casos de éxito.</span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
