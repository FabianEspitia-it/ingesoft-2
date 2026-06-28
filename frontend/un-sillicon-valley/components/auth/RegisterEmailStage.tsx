import Link from "next/link";

import { Icon, RiArrowRightLine, RiMailCheckLine } from "@/components/icons";

export const REGISTER_EMAIL_MESSAGE =
  "Cuenta creada. Revisa tu correo institucional para verificar tu cuenta.";

export function RegisterEmailStage() {
  return (
    <div className="auth-reveal ds-card w-full max-w-md p-10 text-center">
      <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-foreground">
        <Icon icon={RiMailCheckLine} size={32} />
      </span>
      <h2 className="ds-headline mt-6 text-2xl text-foreground">¡Cuenta creada!</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{REGISTER_EMAIL_MESSAGE}</p>
      <p className="mt-4 text-xs text-subtle">
        Revisa tu bandeja de entrada y, si no lo ves, la carpeta de spam.
      </p>
      <Link href="/login" className="ds-btn ds-btn-primary mt-8 inline-flex">
        Ir a iniciar sesión
        <Icon icon={RiArrowRightLine} size={18} />
      </Link>
    </div>
  );
}
