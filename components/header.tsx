import Link from "next/link";
import { Shield } from "lucide-react";
import { navItems, tournamentName } from "@/lib/constants";

export function Header() {
  return (
    <header className="bg-ink text-white shadow-glow">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-gradient-to-br from-turf via-cyan to-gold text-ink">
            <Shield size={22} />
          </span>
          <span>
            <span className="block text-xs font-black uppercase tracking-[0.22em] text-cyan">Football</span>
            <span className="block text-xl font-black">{tournamentName}</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-1 rounded-md bg-white p-1 text-ink">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-2 text-sm font-black transition hover:bg-cyan"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin/login"
            className="rounded-md bg-gold px-4 py-2 text-sm font-black text-white transition hover:bg-cyan hover:text-ink"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </header>
  );
}
