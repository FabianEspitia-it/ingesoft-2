"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { verifyEmail } from "@/lib/api";

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("Verificando tu correo institucional...");

  useEffect(() => {
    const validToken = token;
    if (!validToken) {
      setState("error");
      setMessage("El enlace de verificación no es válido.");
      return;
    }

    let cancelled = false;

    async function verify(currentToken: string) {
      try {
        await verifyEmail(currentToken);
        if (cancelled) return;
        setState("success");
        setMessage("Tu correo fue verificado. Redirigiendo...");
        router.push("/");
        router.refresh();
      } catch (verifyError) {
        if (cancelled) return;
        setState("error");
        setMessage(
          verifyError instanceof Error
            ? verifyError.message
            : "No se pudo verificar tu correo.",
        );
      }
    }

    verify(validToken);

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  const styles =
    state === "success"
      ? "ds-alert ds-alert-success"
      : state === "error"
        ? "ds-alert ds-alert-error"
        : "ds-card px-6 py-8 text-muted";

  return (
    <div className={`text-center text-sm ${styles}`}>
      <p className="font-medium" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
