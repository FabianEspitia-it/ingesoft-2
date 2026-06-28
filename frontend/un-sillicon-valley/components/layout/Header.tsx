"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getCurrentUser, logout } from "@/lib/api";
import { Logo } from "@/components/layout/Logo";
import type { User } from "@/lib/types/user";

type HeaderProps = {
  variant?: "default" | "marketing";
  activePath?: string;
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 shrink-0 text-subtle transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header({ variant = "default", activePath }: HeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const navClass = (path: string) =>
    `relative hidden text-sm font-medium transition md:inline ${
      activePath === path
        ? "text-foreground after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-foreground"
        : "text-muted hover:text-foreground"
    }`;

  const showMarketingLayout = variant === "marketing" || Boolean(user);
  const containerClass = showMarketingLayout
    ? "mx-auto flex max-w-7xl items-center gap-6 px-6 py-3.5"
    : "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className={containerClass}>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          aria-label="UN Silicon Valley — Inicio"
        >
          <Logo showWordmark compactOnMobile={showMarketingLayout} size={showMarketingLayout ? "md" : "sm"} />
        </Link>

        {showMarketingLayout && (
          <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
            <Link href="/" className={navClass("/")}>
              Inicio
            </Link>
            <Link href="/" className={navClass("/destacados")}>
              Destacados
            </Link>
            <Link href="/" className={navClass("/casos-de-exito")}>
              Casos de éxito
            </Link>
          </nav>
        )}

        <div className={`header-actions ${showMarketingLayout ? "ml-auto shrink-0" : ""}`}>
          {showMarketingLayout && (
            <label className="relative hidden w-52 xl:block xl:w-64">
              <span className="sr-only">Buscar entradas</span>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
                <SearchIcon />
              </span>
              <input
                type="search"
                placeholder="Buscar entradas..."
                className="header-search"
              />
            </label>
          )}

          {!showMarketingLayout && (
            <Link href="/" className="text-sm font-medium text-muted transition hover:text-foreground">
              Inicio
            </Link>
          )}

          {isLoading ? (
            <span className="text-subtle text-sm">...</span>
          ) : user ? (
            <>
              <Link
                href="/entries/new"
                className="ds-btn ds-btn-primary ds-btn-pill header-create-btn"
              >
                Crear entrada
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
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
                  <ChevronDownIcon open={menuOpen} />
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
                      onClick={() => setMenuOpen(false)}
                    >
                      Crear entrada
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="header-menu-item"
                    >
                      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : variant === "marketing" ? (
            <>
              <Link
                href="/login"
                className={`ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm ${
                  activePath === "/login" ? "border-foreground text-foreground" : ""
                }`}
              >
                Iniciar sesión
              </Link>
              <Link href="/register" className="ds-btn ds-btn-primary ds-btn-pill px-4 py-2 text-sm">
                Registrarse
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm">
                Iniciar sesión
              </Link>
              <Link href="/register" className="ds-btn ds-btn-primary ds-btn-pill px-4 py-2 text-sm">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
