import Link from "next/link";

import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header activePath="/" />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="ds-eyebrow mb-4">Error 404</p>

        <div className="ds-headline flex items-center justify-center gap-4 leading-none">
          <span className="text-7xl text-primary sm:text-8xl">404</span>
          <span className="h-16 w-px bg-border sm:h-20" aria-hidden="true" />
          <span className="text-left text-2xl sm:text-3xl">
            Página no
            <br />
            encontrada
          </span>
        </div>

        <p className="mt-6 max-w-md text-balance text-muted">
          La página que buscas no existe, cambió de dirección o el enlace está
          roto. Sigue explorando el emprendimiento en la UNAL desde alguno de
          estos lugares.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="ds-btn ds-btn-primary ds-btn-pill px-5 py-2.5 text-sm">
            Volver al inicio
          </Link>
          <Link
            href="/success-stories"
            className="ds-btn ds-btn-ghost ds-btn-pill px-5 py-2.5 text-sm"
          >
            Casos de éxito
          </Link>
          <Link
            href="/featured"
            className="ds-btn ds-btn-ghost ds-btn-pill px-5 py-2.5 text-sm"
          >
            Destacados
          </Link>
        </div>

        <p className="mt-10 text-sm text-subtle">
          ¿Buscabas algo puntual?{" "}
          <Link href="/search" className="ds-link">
            Usa el buscador
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
