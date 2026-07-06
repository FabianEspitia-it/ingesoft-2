"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getCurrentUser, logout } from "@/lib/api";
import { Icon, RiArrowDownSLine, RiSearchLine } from "@/components/icons";
import { Logo } from "@/components/layout/Logo";
import type { User } from "@/lib/types/user";

type HeaderProps = {
  variant?: "default" | "marketing" | "panel";
  activePath?: string;
  disable?: boolean;
};

function getInitial(fullName: string): string {
  return (fullName.trim()[0] ?? "?").toUpperCase();
}

function formatShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  return `${first} ${lastInitial}.`;
}

function AuthActionsSkeleton() {
  return (
    <>
      <span
        className="hidden h-10 w-[8.75rem] shrink-0 rounded-full bg-border/70 motion-reduce:animate-none sm:block"
        aria-hidden="true"
      />
      <span
        className="h-10 w-[6.75rem] shrink-0 rounded-full bg-border/70 motion-reduce:animate-none"
        aria-hidden="true"
      />
    </>
  );
}

function GuestAuthActions({
  activePath,
  variant,
}: {
  activePath?: string;
  variant: "default" | "marketing" | "panel" ;
}) {
  return (
    <>
      <Link
        href="/login"
        className={`ds-btn ds-btn-ghost ds-btn-pill shrink-0 px-4 py-2 text-sm ${
          variant === "marketing" && activePath === "/login"
            ? "border-foreground text-foreground"
            : ""
        }`}
      >
        Iniciar sesión
      </Link>
      <Link href="/register" className="ds-btn ds-btn-primary ds-btn-pill shrink-0 px-4 py-2 text-sm">
        Registrarse
      </Link>
    </>
  );
}

function UserAuthActions({
  user,
  menuOpen,
  menuRef,
  isLoggingOut,
  variant,
  onToggleMenu,
  onLogout,
  onCloseMenu,
}: {
  user: User;
  menuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  isLoggingOut: boolean;
  variant: "default" | "marketing" | "panel";
  onToggleMenu: () => void;
  onLogout: () => void;
  onCloseMenu: () => void;
}) {
  const primaryAction = 
    variant === "panel"
      ? { href: "/admin", label: "Panel de control" }
      : { href: "/entries/new", label: "Crear entrada" };

  return (
    <>
      <Link
        href={primaryAction.href}
        className="ds-btn ds-btn-primary ds-btn-pill header-create-btn shrink-0"
      >
        {primaryAction.label}
      </Link>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={onToggleMenu}
          className="header-user-trigger"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="header-user-avatar" aria-hidden="true">
            {getInitial(user.full_name)}
          </span>
          <span className="hidden max-w-[7.5rem] truncate sm:inline">
            {formatShortName(user.full_name)}
          </span>
          <Icon
            icon={RiArrowDownSLine}
            size={16}
            className={`shrink-0 text-subtle transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div role="menu" className="header-menu">
            <div className="header-menu-user">
              <p className="truncate text-sm font-semibold text-foreground">{user.full_name}</p>
              <p className="mt-0.5 truncate text-xs text-subtle">{user.email}</p>
            </div>
            <Link
              href="/entries/new"
              role="menuitem"
              className="header-menu-item sm:hidden"
              onClick={onCloseMenu}
            >
              Crear entrada
            </Link>
            <Link
              href="/user/edit"
              role="menuitem"
              className="header-menu-item sm:hidden"
              onClick={onCloseMenu}
            >
              Editar perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="header-menu-item"
            >
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function Header({ variant = "default", activePath, disable = false }: HeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [terms, setTerms] = useState("");

  const effectiveVariant: "default" | "marketing" | "panel" =
  !user
    ? "default"
    : user.role === "administrator"
      ? "panel"
      : "marketing";
  
  const showMarketingNav =
    effectiveVariant === "default" ||
    effectiveVariant === "marketing";

  const showSearch =
    effectiveVariant === "default" ||
    effectiveVariant === "marketing";

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const currentUser = await getCurrentUser();
      if (!cancelled) {
        setUser(currentUser);
        setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      setUser(null);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disable || !terms.trim()) return;

    const searchParams = new URLSearchParams();
    searchParams.set("terms", terms.trim());

    router.push(`/search?${searchParams.toString()}`);
  }

  const navClass = (path: string) =>
    `relative text-sm font-medium transition md:inline ${
      activePath === path
        ? "text-primary after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-primary"
        : "text-muted hover:text-primary"
    }`;

  return (
    <header className="fixed site-header sticky top-0 z-20">
      <div className="header-inner header-inner--marketing">
        <Link
          href="/"
          className="header-brand inline-flex shrink-0 items-center"
          aria-label="UN Silicon Valley — Inicio"
        >
          <Logo
            showWordmark
            compactOnMobile={effectiveVariant !== "panel"}
            size={effectiveVariant !== "panel" ? "md" : "sm"}
          />
        </Link>

        {showMarketingNav ? (
          <nav className="header-nav hidden items-center justify-center gap-8 lg:flex">
            <Link href="/" className={navClass("/")}>
              Inicio
            </Link>

            <Link href="/featured" className={navClass("/destacados")}>
              Destacados
            </Link>

            <Link href="/" className={navClass("/casos-de-exito")}>
              Casos de éxito
            </Link>
          </nav>
        ) : (
          <nav className="header-nav hidden items-center justify-center gap-8 lg:flex">
            <Link href="/" className={navClass("/")}>
              Inicio
            </Link>
          </nav>
        )}

        <div
          className={`header-end ${
            effectiveVariant === "panel" ? "shrink-0" : ""
          }`}
        >
          {showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className={`header-search-slot hidden shrink-0 xl:block ${disable ? "pointer-events-none" : ""}`}
            >
              <label
                className={`relative block w-52 xl:w-64 ${
                  disable ? "header-search-wrapper--disabled" : ""
                }`}
              >
                <span className="sr-only">Buscar entradas</span>
                <span className="header-search-icon pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
                  <Icon icon={RiSearchLine} size={16} />
                </span>
                <input
                  type="search"
                  placeholder="Buscar entradas…"
                  disabled={disable}
                  aria-disabled={disable}
                  title={disable ? "Desactivado durante búsqueda avanzada" : undefined}
                  className="header-search"
                  name="terms"
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                />
              </label>
            </form>
          )}

          <div className="header-auth-slot" aria-busy={isLoading}>
            {isLoading ? (
              <AuthActionsSkeleton />
            ) : user ? (
              <UserAuthActions
                user={user}
                menuOpen={menuOpen}
                menuRef={menuRef}
                isLoggingOut={isLoggingOut}
                variant={effectiveVariant}  
                onToggleMenu={() => setMenuOpen((open) => !open)}
                onLogout={handleLogout}
                onCloseMenu={() => setMenuOpen(false)}
              />
            ) : (
              <GuestAuthActions activePath={activePath} variant="default" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
