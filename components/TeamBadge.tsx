interface TeamBadgeProps {
  name: string;
  flag?: string;
  pot?: string;
  className?: string;
}

export function TeamBadge({ name, flag, pot, className = "" }: TeamBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm dark:bg-slate-700 ${className}`}
    >
      {flag && <span>{flag}</span>}
      <span>{name}</span>
      {pot && (
        <span className="text-xs text-slate-500">Pot {pot}</span>
      )}
    </span>
  );
}
