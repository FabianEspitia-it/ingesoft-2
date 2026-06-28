import { Suspense } from "react";

import { RegisterPageContent } from "@/components/auth/RegisterPageContent";
import { Header } from "@/components/layout/Header";

export default function RegisterPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header variant="marketing" activePath="/register" />
      <Suspense
        fallback={
          <main className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-sm text-subtle">Cargando...</p>
          </main>
        }
      >
        <RegisterPageContent />
      </Suspense>
    </div>
  );
}
