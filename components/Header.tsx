import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const navLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm font-medium text-slate-700 transition active:scale-95 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:px-3";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto max-w-lg space-y-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="text-lg font-bold text-pitch-700 dark:text-pitch-500"
          >
            ⚽ SweepStake Pro
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link href="/leaderboard" className={navLinkClass}>
            Leaderboard
          </Link>
          <Link href="/rules" className={navLinkClass}>
            Rules
          </Link>
          <Link href="/admin" className={navLinkClass}>
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
