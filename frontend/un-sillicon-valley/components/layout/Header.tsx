"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getCurrentUser, logout } from "@/lib/api";
import { Icon, RiArrowDownSLine, RiSearchLine } from "@/components/icons";
import { Logo } from "@/components/layout/Logo";
import type { User } from "@/lib/types/user";

type HeaderProps = {
  variant?: "default" | "marketing";
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

export function Header({ variant = "default", activePath, disable = false }: HeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [terms, setTerms] = useState("");  

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
    if (!terms.trim()) return;

    const searchParams = new URLSearchParams();
    searchParams.set("terms", terms.trim());

    router.push(`/search?${searchParams.toString()}`)
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

        <div className={`header-actions ${showMarketingLayout ? "ml-auto shrink-0" : ""}`} >
          {showMarketingLayout && (
            <form onSubmit={handleSearchSubmit}>
            <label className="relative hidden w-52 xl:block xl:w-64">
              <span className="sr-only">Buscar entradas</span>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
                <Icon icon={RiSearchLine} size={16} />
              </span>
              <input
                type="search"
                placeholder="Buscar entradas..."
                disabled={disable}
                className="header-search"
                name="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </label>
            </form>
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
