import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-pitch-700 dark:text-pitch-500">
          ⚽ SweepStake Pro
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/leaderboard"
            className="text-slate-600 hover:text-pitch-600 dark:text-slate-300"
          >
            Leaderboard
          </Link>
          <Link
            href="/admin"
            className="text-slate-600 hover:text-pitch-600 dark:text-slate-300"
          >
            Admin
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
