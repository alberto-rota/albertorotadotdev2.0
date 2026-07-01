"use client";

import * as React from "react";
import { Quote } from "lucide-react";

const pillClass =
  "inline-flex h-9 items-center gap-2 rounded-full border border-transparent bg-white px-4 text-sm font-display tracking-[0.12em] uppercase leading-none text-black hover:bg-white/90";

type CiteButtonProps = {
  citationPath: string;
};

export function CiteButton({ citationPath }: CiteButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [label, setLabel] = React.useState("Cite it");
  const [busy, setBusy] = React.useState(false);
  const labelResetRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setLabel("Cite it");
    setBusy(false);
    buttonRef.current?.classList.remove("cite-button--flash");
  }, [citationPath]);

  const flashInverted = React.useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    el.classList.remove("cite-button--flash");
    void el.offsetWidth;
    el.classList.add("cite-button--flash");
  }, []);

  const onAnimationEnd = (e: React.AnimationEvent<HTMLButtonElement>) => {
    if (e.target !== e.currentTarget || e.animationName !== "cite-button-flash") return;
    e.currentTarget.classList.remove("cite-button--flash");
  };

  const onClick = async () => {
    if (busy) return;
    flashInverted();
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
      if (labelResetRef.current !== null) {
        window.clearTimeout(labelResetRef.current);
      }
      labelResetRef.current = window.setTimeout(() => setLabel("Cite it"), 2000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (labelResetRef.current !== null) {
        window.clearTimeout(labelResetRef.current);
      }
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onAnimationEnd={onAnimationEnd}
      aria-label="Copy citation to clipboard"
      className={pillClass}
    >
      <Quote className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
