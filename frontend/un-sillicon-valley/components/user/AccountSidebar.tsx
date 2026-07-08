"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon, RiArticleLine, RiLogoutBoxRLine, RiUserLine } from "@/components/icons";
import { logout } from "@/lib/api";

type Props = {
  /** Ítem activo del menú. */
  active?: "edit" | "posts";
};

const ITEM_BASE =
  "flex w-full items-center gap-2.5 rounded-full border px-4 py-2.5 text-left text-sm font-medium transition-colors";

export function AccountSidebar({ active = "edit" }: Props) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside aria-label="Mi cuenta" className="w-full shrink-0 lg:w-60">
      <p className="ds-eyebrow mb-3 px-1 text-xs">Mi cuenta</p>

      <nav className="flex flex-col gap-2">
        <Link
          href="/user/edit"
          aria-current={active === "edit" ? "page" : undefined}
          className={`${ITEM_BASE} ${
            active === "edit"
              ? "border-border bg-surface text-foreground shadow-[var(--shadow-soft)]"
              : "border-transparent text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          <Icon icon={RiUserLine} size={17} />
          Editar perfil
        </Link>

        <Link
          href="/user/publications"
          aria-current={active === "posts" ? "page" : undefined}
          className={`${ITEM_BASE} ${
            active === "posts"
              ? "border-border bg-surface text-foreground shadow-[var(--shadow-soft)]"
              : "border-border border-dashed text-muted hover:bg-surface hover:text-foreground"
          }`}
        >
          <Icon icon={RiArticleLine} size={17} />
          Mis publicaciones
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`${ITEM_BASE} border-border border-dashed text-muted hover:bg-surface hover:text-foreground disabled:opacity-50`}
        >
          <Icon icon={RiLogoutBoxRLine} size={17} />
          {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </nav>
    </aside>
  );
}
