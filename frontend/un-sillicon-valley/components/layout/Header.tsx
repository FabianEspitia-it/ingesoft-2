import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-emerald-800">
          UN Silicon Valley
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-zinc-700 hover:text-emerald-800">
            Inicio
          </Link>
          <Link
            href="/entries/new"
            className="rounded-full bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800"
          >
            Crear una entrada
          </Link>
        </nav>
      </div>
    </header>
  );
}
