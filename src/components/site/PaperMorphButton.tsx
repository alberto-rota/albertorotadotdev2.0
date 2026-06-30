"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Link2 } from "lucide-react";
import { Icon } from "./Icon";

const SPRING = { type: "spring" as const, stiffness: 360, damping: 34, mass: 0.9 };

/** Fixed outer pill height — independent of `text-sm` label sizing. */
const PILL = 36;
const INNER = 32;
const GAP = 6;
const PADX = (PILL - INNER) / 2;
const BTN_W = 80;
const EXPANDED_W = BTN_W * 2 + GAP + PADX * 2;

const labelClass =
  "font-display text-sm tracking-[0.12em] uppercase leading-none text-black";

const subPillClass =
  "flex h-8 shrink-0 items-center justify-center gap-2 rounded-full border border-black/15 bg-white font-display text-sm tracking-[0.12em] uppercase leading-none text-black hover:bg-black hover:text-white transition-colors";

type PaperMorphButtonProps = {
  doi: string;
  pdf: string;
  label?: string;
  icon?: string;
};

export function PaperMorphButton({
  doi,
  pdf,
  label = "Paper",
  icon = "FileText",
}: PaperMorphButtonProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const [labelW, setLabelW] = React.useState<number | undefined>(undefined);

  React.useLayoutEffect(() => {
    if (!open && labelRef.current) {
      setLabelW(Math.ceil(labelRef.current.offsetWidth) + 34);
    }
  }, [open, label]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <motion.div
      ref={rootRef}
      className="relative h-9 shrink-0 overflow-hidden rounded-full"
      animate={{
        width: open ? EXPANDED_W : labelW ?? "auto",
        backgroundColor: "#ffffff",
      }}
      transition={SPRING}
    >
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="links"
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ gap: GAP, paddingLeft: PADX, paddingRight: PADX }}
            variants={{
              visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
              exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
            }}
            initial="exit"
            animate="visible"
            exit="exit"
          >
            <motion.a
              href={doi}
              target="_blank"
              rel="noreferrer"
              aria-label="Open DOI"
              title="DOI"
              style={{ width: BTN_W }}
              variants={{ visible: { scale: 1 }, exit: { scale: 0 } }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
              className={subPillClass}
              onClick={() => setOpen(false)}
            >
              <Link2 className="h-4 w-4 shrink-0" aria-hidden />
              DOI
            </motion.a>
            <motion.a
              href={pdf}
              target="_blank"
              rel="noreferrer"
              aria-label="Open PDF"
              title="PDF"
              style={{ width: BTN_W }}
              variants={{ visible: { scale: 1 }, exit: { scale: 0 } }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
              className={subPillClass}
              onClick={() => setOpen(false)}
            >
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
              PDF
            </motion.a>
          </motion.div>
        ) : (
          <motion.button
            key="label"
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 z-0 flex items-center justify-center gap-2 px-4 text-black"
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={SPRING}
            aria-label={label}
            aria-expanded={open}
          >
            <span ref={labelRef} className={`flex items-center gap-2 ${labelClass}`}>
              <Icon name={icon} size={16} className="h-4 w-4 object-contain" />
              <span>{label}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
