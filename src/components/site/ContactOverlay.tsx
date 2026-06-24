"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Github, Linkedin, Handshake } from "lucide-react";

type ContactEntry = {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
};

const CONTACTS: ContactEntry[] = [
  {
    id: "email",
    label: "alberto_rota@outlook.com",
    href: "mailto:alberto_rota@outlook.com",
    icon: <Mail className="h-4.5 w-4.5" />,
  },
  {
    id: "github",
    label: "github.com/alberto-rota",
    href: "https://github.com/alberto-rota",
    icon: <Github className="h-4.5 w-4.5" />,
  },
  {
    id: "linkedin",
    label: "linkedin.com/in/albe-rota",
    href: "https://www.linkedin.com/in/albe-rota/",
    icon: <Linkedin className="h-4.5 w-4.5" />,
  },
];

// Geometry of the expanded icon row (kept in sync with the classNames below).
const PILL = 36; // h-9 pill height
const ICON = 32; // h-8 w-8 icons
const GAP = 6;
// Horizontal padding equals the vertical inset (PILL - ICON) / 2 so the first
// and last icon circles sit concentric with the pill's rounded end caps.
const PADX = (PILL - ICON) / 2;
const N = CONTACTS.length;
const ICONS_WIDTH = N * ICON + (N - 1) * GAP + PADX * 2;

const SPRING = { type: "spring" as const, stiffness: 360, damping: 34, mass: 0.9 };

export function ContactMorph({
  open,
  onOpenChange,
  mobile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile?: boolean;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const [labelW, setLabelW] = React.useState<number | undefined>(undefined);

  // Measure the collapsed (label) width so the box can morph between the two
  // exact sizes. Only valid while the label is mounted (i.e. when closed).
  React.useLayoutEffect(() => {
    if (!open && labelRef.current) {
      setLabelW(Math.ceil(labelRef.current.offsetWidth) + 26);
    }
  }, [open]);

  // Close on outside-click and Escape.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <motion.div
      ref={rootRef}
      className={
        mobile
          ? "relative h-12 w-full shrink-0 overflow-hidden rounded-2xl border"
          : "relative h-9 shrink-0 overflow-hidden rounded-full border"
      }
      animate={{
        width: mobile ? "100%" : open ? ICONS_WIDTH : labelW ?? "auto",
        backgroundColor: "#ffffff",
        borderColor: open ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0)",
      }}
      transition={SPRING}
    >
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="icons"
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{
              gap: mobile ? 10 : GAP,
              paddingLeft: mobile ? 6 : PADX,
              paddingRight: mobile ? 6 : PADX,
            }}
            variants={{
              visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
              exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
            }}
            initial="exit"
            animate="visible"
            exit="exit"
          >
            {CONTACTS.map((c) => (
              <motion.a
                key={c.id}
                href={c.href}
                target={c.href?.startsWith("http") ? "_blank" : undefined}
                rel={c.href?.startsWith("http") ? "noreferrer" : undefined}
                onClick={(e: React.MouseEvent) => {
                  if (!c.href) e.preventDefault();
                  onOpenChange(false);
                }}
                title={c.label}
                aria-label={c.label}
                variants={{
                  visible: { scale: 1 },
                  exit: { scale: 0 },
                }}
                transition={{ type: "spring", stiffness: 520, damping: 30 }}
                className={
                  mobile
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white transition-colors"
                    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white transition-colors"
                }
              >
                {c.icon}
              </motion.a>
            ))}
          </motion.div>
        ) : (
          <motion.button
            key="label"
            onClick={() => onOpenChange(true)}
            className="absolute inset-0 z-0 flex items-center justify-center gap-2 px-3 text-black"
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={SPRING}
            aria-label="Connect"
          >
            <span
              ref={labelRef}
              className={
                mobile
                  ? "flex items-center gap-2 text-sm font-medium uppercase tracking-wider"
                  : "flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
              }
            >
              <Handshake className="h-4 w-4" />
              <span>Connect</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
