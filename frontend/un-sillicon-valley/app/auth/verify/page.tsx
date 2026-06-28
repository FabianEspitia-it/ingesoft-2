import { Suspense } from "react";

import { VerifyEmailStatus } from "@/components/auth/VerifyEmailStatus";
import { Header } from "@/components/layout/Header";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md px-6 py-10">
        <section className="mb-8 text-center">
          <h1 className="ds-headline text-3xl text-foreground">Verificar correo</h1>
          <p className="mt-2 text-muted">
            Estamos confirmando tu correo institucional.
          </p>
        </section>

        <Suspense fallback={<p className="text-sm text-subtle">Cargando...</p>}>
          <VerifyEmailStatus />
        </Suspense>
      </main>
    </div>
  );
}
