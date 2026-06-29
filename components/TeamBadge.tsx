interface TeamBadgeProps {
  name: string;
  flag?: string;
  pot?: string;
  eliminated?: boolean;
  className?: string;
}

export function TeamBadge({
  name,
  flag,
  pot,
  eliminated = false,
  className = "",
}: TeamBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm ${
        eliminated
          ? "bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500"
          : "bg-slate-100 dark:bg-slate-700"
      } ${className}`}
      title={eliminated ? `${name} — knocked out` : undefined}
    >
      {flag && (
        <span className={eliminated ? "opacity-50 grayscale" : undefined}>
          {flag}
        </span>
      )}
      <span className={eliminated ? "line-through decoration-slate-400" : undefined}>
        {name}
      </span>
      {pot && (
        <span
          className={`text-xs ${eliminated ? "text-slate-400 line-through" : "text-slate-500"}`}
        >
          Pot {pot}
        </span>
      )}
      {eliminated && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Out
        </span>
      )}
    </span>
  );
}
