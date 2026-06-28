"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/api";

export function AuthGuard({
  children,
  redirectTo = "/login?next=/entries/new",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const user = await getCurrentUser();
      if (cancelled) return;

      if (!user) {
        router.replace(redirectTo);
        return;
      }

      setIsAuthorized(true);
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);

  if (!isAuthorized) {
    return (
      <p className="ds-card px-4 py-3 text-sm text-muted">
        Verificando sesión...
      </p>
    );
  }

  return children;
}
