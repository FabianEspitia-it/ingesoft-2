"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";
import type { EntrySummary } from "@/lib/types/entry";
import type { User } from "@/lib/types/user";

type HomeSidebarProps = {
  successCases: EntrySummary[];
};

export function HomeSidebar({ successCases }: HomeSidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <aside aria-label="Contenido complementario" className="flex flex-col gap-6">
      <section className="ds-card p-5" aria-labelledby="sidebar-success-heading">
        <h2 id="sidebar-success-heading" className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
          <span aria-hidden="true">🏆</span>
          <span>Casos de éxito</span>
        </h2>
        {successCases.length > 0 ? (
          <ul className="space-y-2.5" role="list">
            {successCases.slice(0, 3).map((entry) => (
              <li key={entry.id} className="text-sm leading-snug">
                <Link
                  href={`/entries/${entry.id}`}
                  className="text-muted transition-colors hover:text-primary focus-visible:text-primary"
                >
                  &ndash; {entry.title.length > 35 ? `${entry.title.slice(0, 35)}\u2026` : entry.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle">Aún no hay casos de éxito.</p>
        )}
        <Link
          href="/casos-de-exito"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:text-primary"
        >
          Ver todos &rarr;
        </Link>
      </section>

      <section className="ds-card p-5" aria-labelledby="sidebar-cta-heading">
        {!isLoading && user ? (
          <>
            <h2 id="sidebar-cta-heading" className="mb-2 text-sm font-bold text-foreground">
              ¿Tienes algo que contar?
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-muted">
              Comparte tu experiencia con la comunidad UNAL.
            </p>
            <Link
              href="/entries/new"
              className="ds-btn ds-btn-primary w-full justify-center py-2.5 text-sm"
            >
              Crear entrada
            </Link>
          </>
        ) : (
          <>
            <h2 id="sidebar-cta-heading" className="mb-2 text-sm font-bold text-foreground">
              ¿Tienes algo que contar?
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-muted">
              Únete con tu correo @unal.edu.co y publica tu primera entrada.
            </p>
            <Link
              href="/register"
              className="ds-btn ds-btn-primary w-full justify-center py-2.5 text-sm"
            >
              Crear cuenta
            </Link>
          </>
        )}
      </section>
    </aside>
  );
}
