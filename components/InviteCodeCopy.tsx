"use client";

import { useState } from "react";

export function InviteCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-lg bg-pitch-100 px-4 py-2 text-2xl font-bold tracking-widest text-pitch-900 dark:bg-pitch-900 dark:text-pitch-100">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg bg-pitch-600 px-3 py-2 text-sm text-white hover:bg-pitch-700"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
