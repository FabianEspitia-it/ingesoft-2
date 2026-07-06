"use client";

import type { RemixiconComponentType } from "@remixicon/react";
import {
  Icon,
  RiArticleLine,
  RiChat3Line,
} from "@/components/icons";
import { Logo } from "@/components/layout/Logo";

export type View = "entries" | "comments";

const links: {
  key: View;
  icon: RemixiconComponentType;
  label: string;
}[] = [
  {
    key: "entries",
    icon: RiArticleLine,
    label: "Entradas",
  },
  {
    key: "comments",
    icon: RiChat3Line,
    label: "Comentarios",
  },
];

export function Sidebar({
  activeView,
  onChangeView,
}: {
  activeView: View;
  onChangeView: (view: View) => void;
}) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-border bg-background p-4">
      <div className="mb-8">
        <Logo showWordmark={false} size="lg" />
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = activeView === link.key;

          return (
            <button
              key={link.key}
              onClick={() => onChangeView(link.key)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                isActive
                  ? "border-border bg-accent/15 text-foreground"
                  : "border-transparent text-muted hover:border-border hover:bg-background/40"
              }`}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15">
                <Icon icon={link.icon} size={20} />
              </span>

              {link.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}