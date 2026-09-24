import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          CV Adapter
        </Link>
        <nav className="flex gap-4 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-950">
            Offres
          </Link>
          <Link href="/cv" className="hover:text-zinc-950">
            CV maitre
          </Link>
        </nav>
      </div>
    </header>
  );
}
