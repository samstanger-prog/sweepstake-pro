interface TeamBadgeProps {
  name: string;
  flag?: string;
  pot?: string;
  eliminated?: boolean;
  compact?: boolean;
  className?: string;
}

export function TeamBadge({
  name,
  flag,
  pot,
  eliminated = false,
  compact = false,
  className = "",
}: TeamBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
        compact ? "text-xs" : "text-sm"
      } ${
        eliminated
          ? "bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500"
          : "bg-slate-100 dark:bg-slate-700"
      } ${className}`}
      title={eliminated ? `${name} — knocked out` : undefined}
    >
      {flag && (
        <span
          className={`emoji-flag shrink-0 text-base ${
            eliminated ? "opacity-50 grayscale" : ""
          }`}
          aria-hidden
        >
          {flag}
        </span>
      )}
      <span className={eliminated ? "line-through decoration-slate-400" : undefined}>
        {name}
      </span>
      {pot && (
        <span
          className={`${compact ? "text-[10px]" : "text-xs"} ${
            eliminated ? "text-slate-400 line-through" : "text-slate-500"
          }`}
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
