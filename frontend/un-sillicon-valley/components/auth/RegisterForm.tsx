"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useMemo, useState, useTransition } from "react";

import { register } from "@/lib/api";
import { AFFILIATION_LABELS, type UserAffiliation } from "@/lib/types/user";

const AFFILIATIONS: UserAffiliation[] = ["student", "graduate", "professor"];
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;
const INPUT_CLASS = "auth-input auth-input-compact";

const PasswordRule = memo(function PasswordRule({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <li
      className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
        met ? "text-primary" : "text-subtle"
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          met
            ? "bg-primary/20 text-primary"
            : "bg-background/50 text-subtle"
        }`}
        aria-hidden="true"
      >
        {met ? "✓" : "○"}
      </span>
      <span>{label}</span>
    </li>
  );
});

const AffiliationPicker = memo(function AffiliationPicker({
  value,
  onChange,
}: {
  value: UserAffiliation;
  onChange: (value: UserAffiliation) => void;
}) {
  return (
    <fieldset>
      <legend className="ds-label mb-2">
        Afiliación <span className="text-[var(--error)]">*</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {AFFILIATIONS.map((affiliation) => {
          const isSelected = value === affiliation;
          return (
            <button
              key={affiliation}
              type="button"
              onClick={() => onChange(affiliation)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "border-accent/60 bg-accent/15 text-foreground"
                  : "border-border bg-background/30 text-muted hover:border-primary/50 hover:text-foreground"
              }`}
              aria-pressed={isSelected}
            >
              {AFFILIATION_LABELS[affiliation]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
});

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState<UserAffiliation>("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const passwordRules = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: HAS_UPPERCASE.test(password),
      number: HAS_NUMBER.test(password),
    }),
    [password],
  );

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid =
    passwordRules.minLength && passwordRules.uppercase && passwordRules.number;
  const canSubmit =
    acceptedTerms && isPasswordValid && passwordsMatch && fullName.trim() && email.trim();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("La contraseña no cumple los requisitos mínimos.");
      return;
    }

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    startTransition(async () => {
      try {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          affiliation,
          accepted_terms: acceptedTerms,
        });
        router.replace("/register?stage=email");
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "No se pudo crear la cuenta.",
        );
      }
    });
  }

  return (
    <div className="auth-reveal w-full max-w-3xl">
      <header className="mb-5">
        <h1 className="ds-headline text-3xl text-foreground xl:text-[2rem]">
          Crear cuenta de autor
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Solo correos institucionales{" "}
          <span className="ds-badge">@unal.edu.co</span>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div role="alert" className="ds-alert ds-alert-error">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="full_name" className="ds-label">
              Nombre completo <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoFocus
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={INPUT_CLASS}
              placeholder="Ej: María González Rodríguez"
            />
          </div>

          <div>
            <label htmlFor="email" className="ds-label">
              Correo institucional <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
              placeholder="usuario@unal.edu.co"
            />
          </div>
        </div>

        <AffiliationPicker value={affiliation} onChange={setAffiliation} />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="password" className="ds-label">
              Contraseña <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASS}
              autoComplete="new-password"
            />
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <PasswordRule met={passwordRules.minLength} label="Mínimo 8 caracteres" />
              <PasswordRule met={passwordRules.uppercase} label="1 mayúscula" />
              <PasswordRule met={passwordRules.number} label="1 número" />
            </ul>
          </div>

          <div>
            <label htmlFor="confirm_password" className="ds-label">
              Confirmar contraseña <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`${INPUT_CLASS} ${
                confirmPassword && !passwordsMatch ? "auth-input-error" : ""
              }`}
              autoComplete="new-password"
            />
            {confirmPassword && !passwordsMatch ? (
              <p className="mt-1.5 text-xs text-[var(--error)]">Las contraseñas no coinciden.</p>
            ) : null}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-background/30 p-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span>Acepto los términos y condiciones de la plataforma</span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="group relative ds-btn ds-btn-primary overflow-hidden sm:min-w-[200px]"
          >
            <span className={`relative z-10 inline-flex items-center gap-2 ${isPending ? "opacity-80" : ""}`}>
              {isPending ? "Creando cuenta..." : "Crear cuenta"}
              {!isPending ? <span aria-hidden="true">→</span> : null}
            </span>
            {isPending ? (
              <span className="absolute inset-0 overflow-hidden">
                <span className="absolute inset-y-0 w-1/2 bg-background/10 [animation:auth-shimmer_1.1s_ease-in-out_infinite]" />
              </span>
            ) : null}
          </button>

          <p className="text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="ds-link">
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
