import type { RemixiconComponentType } from "@remixicon/react";

import {
  Icon,
  RiChat3Line,
  RiQuillPenLine,
  RiTrophyLine,
  RiUserLine,
} from "@/components/icons";
import { Logo } from "@/components/layout/Logo";

const features: { icon: RemixiconComponentType; text: string }[] = [
  {
    icon: RiQuillPenLine,
    text: "Publica entradas con texto enriquecido, imágenes y etiquetas.",
  },
  {
    icon: RiChat3Line,
    text: "Comenta y participa en discusiones técnicas.",
  },
  {
    icon: RiTrophyLine,
    text: "Tu historia puede convertirse en caso de éxito.",
  },
  {
    icon: RiUserLine,
    text: "Perfil público que muestra tu portafolio.",
  },
];

export function RegisterSidebar() {
  return (
    <div className="auth-reveal auth-reveal-delay-2 relative flex h-full min-h-0 flex-col">
      <div className="relative mb-6">
        <Logo showWordmark={false} size="lg" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Comunidad UNAL
      </p>
      <h2 className="ds-headline mt-2 max-w-sm text-2xl leading-tight text-foreground">
        Comparte lo que aprendes construyendo.
      </h2>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li
            key={feature.text}
            className="flex gap-3 rounded-xl border border-border bg-background/25 p-3"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-foreground">
              <Icon icon={feature.icon} size={20} />
            </span>
            <span className="text-sm leading-snug text-muted">{feature.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-dashed border-border pt-5">
        <p className="rounded-xl border border-border bg-background/25 p-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Nota:</span> Después de crear la
          cuenta recibirás un correo de verificación. Tu cuenta no se activará hasta que
          confirmes el correo.
        </p>
      </div>
    </div>
  );
}
