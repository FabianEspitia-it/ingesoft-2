"use client";

import { memo, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Icon, RiArrowRightLine } from "@/components/icons";
import {
  User,
  UpdateUserPayload,
  AFFILIATION_LABELS,
  type UserAffiliation,
} from "@/lib/types/user";
import { getCurrentUser, updateUser } from "@/lib/api";
import { ProjectList } from "@/components/projects/ProjectList";

const AFFILIATIONS: UserAffiliation[] = ["student", "graduate", "professor"];

const AffiliationPicker = memo(function AffiliationPicker({
  value,
  onChange,
}: {
  value: UserAffiliation;
  onChange: (value: UserAffiliation) => void;
}) {
  return (
    <fieldset>
      <legend className="ds-label mb-2">Afiliación</legend>
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

// ─── Formulario principal ──────────────────────────────────────────────────────

const INPUT_CLASS = "auth-input auth-input-compact";

export function EditProfileForm() {
  const router = useRouter();

  // Usuario actual (se carga desde la API)
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Estado del formulario
  const [fullName, setFullName] = useState("");
  const [affiliation, setAffiliation] = useState<UserAffiliation>("student");
  const [bio, setBio] = useState("");

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Carga inicial del usuario y su formulario
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;
        if (!currentUser) throw new Error("No se pudo cargar el perfil.");

        setUser(currentUser);
        setFullName(currentUser.full_name);
        setAffiliation(currentUser.affiliation);
        setBio(currentUser.biography ?? "");
        setAvatarPreview(currentUser.profile_picture ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  // Convierte el archivo de avatar a un data URL para enviarlo al backend.
  // Si tu API expone un endpoint de subida de archivos dedicado (p. ej. S3/pre-signed URL),
  // reemplaza esta función por una llamada a ese endpoint y usa la URL resultante.
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.readAsDataURL(file);
    });
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const payload: UpdateUserPayload = {
          full_name: fullName,
          affiliation,
          biography: bio,
        };

        if (avatarFile) {
          payload.profile_picture = await fileToDataUrl(avatarFile);
        } else if (avatarPreview === null && user?.profile_picture) {
          // El usuario quitó su foto existente
          payload.profile_picture = "";
        }

        const updatedUser = await updateUser(payload);
        setUser(updatedUser);
        setAvatarFile(null);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
      }
    });
  }

  const getInitial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

  if (loadingUser) {
    return (
      <div className="mx-auto w-full max-w-2xl py-16 text-center text-sm text-muted">
        Cargando perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <div role="alert" className="ds-alert ds-alert-error mx-auto w-full max-w-2xl">
        {error ?? "No se pudo cargar el perfil."}
      </div>
    );
  }

  return (
    <div className="auth-reveal mx-auto w-full max-w-2xl">
      <header className="mb-7">
        <h1 className="ds-headline text-3xl text-foreground xl:text-[2rem]">Editar perfil</h1>
        <p className="mt-1.5 text-sm text-muted">
          Los cambios se reflejarán en tu perfil público.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta de error */}
        {error && (
          <div role="alert" className="ds-alert ds-alert-error">
            {error}
          </div>
        )}

        {/* Alerta de éxito */}
        {success && (
          <div role="status" className="ds-alert ds-alert-success">
            Perfil actualizado correctamente.
          </div>
        )}

        {/* ── Foto de perfil ── */}
        <section className="rounded-2xl border border-border bg-background/30 p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Foto de perfil</h2>
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border bg-background/50">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted">
                  {getInitial(fullName || user.full_name)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="ds-btn ds-btn-ghost ds-btn-pill cursor-pointer px-4 py-2 text-sm">
                Subir foto
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm text-[var(--error)] hover:border-[var(--error)]/40"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Información básica ── */}
        <section className="rounded-2xl border border-border bg-background/30 p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Información básica</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="ds-label">
                Nombre completo
              </label>
              <input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Tu nombre completo"
              />
            </div>

            <AffiliationPicker value={affiliation} onChange={setAffiliation} />

            <div>
              <label htmlFor="email" className="ds-label">
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                readOnly
                disabled
                className={`${INPUT_CLASS} cursor-not-allowed opacity-50`}
              />
              <p className="mt-1 text-xs text-subtle">El correo no se puede cambiar.</p>
            </div>

            <div>
              <label htmlFor="bio" className="ds-label">
                Biografía
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className={`${INPUT_CLASS} resize-none`}
                placeholder="Cuéntanos un poco sobre ti..."
              />
              <p className="mt-1 text-right text-xs text-subtle">{bio.length} caracteres</p>
            </div>
          </div>
        </section>

        {/* ── Portafolio ── */}
        <ProjectList userId={user.id} />

        {/* ── Botón guardar ── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="group relative ds-btn ds-btn-primary overflow-hidden sm:min-w-[200px]"
          >
            <span className={`relative z-10 inline-flex items-center gap-2 ${isPending ? "opacity-80" : ""}`}>
              {isPending ? "Guardando..." : "Guardar cambios"}
              {!isPending && <Icon icon={RiArrowRightLine} size={18} />}
            </span>
            {isPending && (
              <span className="absolute inset-0 overflow-hidden">
                <span className="absolute inset-y-0 w-1/2 bg-background/10 [animation:auth-shimmer_1.1s_ease-in-out_infinite]" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}