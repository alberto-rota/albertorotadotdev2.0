"use client";

import * as React from "react";
import { Quote } from "lucide-react";

const pillClass =
  "inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-display tracking-[0.12em] uppercase leading-none text-black transition-colors hover:bg-white/90 disabled:opacity-60";

type CiteButtonProps = {
  citationPath: string;
};

export function CiteButton({ citationPath }: CiteButtonProps) {
  const [label, setLabel] = React.useState("Cite it");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setLabel("Cite it");
    setBusy(false);
  }, [citationPath]);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(citationPath);
      if (!res.ok) throw new Error("Citation file not found");
      const text = (await res.text()).trim();
      if (!text) throw new Error("Citation file is empty");
      await navigator.clipboard.writeText(text);
      setLabel("Copied!");
    } catch {
      setLabel("Copy failed");
    } finally {
      setBusy(false);
      window.setTimeout(() => setLabel("Cite it"), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="Copy citation to clipboard"
      className={pillClass}
    >
      <Quote className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
