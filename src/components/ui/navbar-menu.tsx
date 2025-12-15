"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import { motion } from "motion/react";

const transition = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
} satisfies import("motion/react").Transition;

function useIsCoarsePointer() {
  const [isCoarse, setIsCoarse] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia?.("(hover: none), (pointer: coarse)");
    if (!mq) return;

    const update = () => setIsCoarse(Boolean(mq.matches));
    update();

    // Safari < 14 uses addListener/removeListener.
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
    } else {
      mq.addListener(update);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", update);
      } else {
        mq.removeListener(update);
      }
    };
  }, []);

  return isCoarse;
}

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
  onClick,
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) => {
  const isCoarsePointer = useIsCoarsePointer();

  return (
    <div
      onPointerEnter={(e) => {
        // Hover UX only for true mouse pointers.
        if (isCoarsePointer) return;
        if ((e as React.PointerEvent).pointerType === "mouse") setActive(item);
      }}
      className="relative"
    >
      <motion.p
        transition={{ duration: 0.3 }}
        onClick={() => {
          // On touch devices, hover menus are not discoverable/reliable; treat the top-level
          // item as a direct action (scroll / navigate) and keep dropdowns desktop-only.
          if (onClick) onClick();
          if (isCoarsePointer) setActive(null);
        }}
        className="cursor-pointer select-none touch-manipulation text-black hover:opacity-[0.9] dark:text-white"
      >
        {item}
      </motion.p>
      {!isCoarsePointer && active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-[calc(100%+1.2rem)] left-1/2 transform -translate-x-1/2 pt-4">
              <motion.div
                transition={transition}
                layoutId="active" // layoutId ensures smooth animation
                className="bg-white dark:bg-black backdrop-blur-sm rounded-2xl overflow-hidden border border-black/20 dark:border-white/20 shadow-xl"
              >
                <motion.div
                  layout // layout ensures smooth animation
                  className="w-max h-full p-4"
                >
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) => {
  const isCoarsePointer = useIsCoarsePointer();
  return (
    <nav
      onPointerLeave={(e) => {
        if (isCoarsePointer) return;
        if ((e as React.PointerEvent).pointerType === "mouse") setActive(null);
      }} // resets the state (desktop hover only)
      className="relative rounded-full border border-transparent dark:bg-black dark:border-white/20 bg-white shadow-input flex justify-center space-x-2 md:space-x-4 px-4 md:px-8 py-3 md:py-6"
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <a href={href} className="flex space-x-2">
      <img
        src={src}
        width={140}
        height={70}
        alt={title}
        className="shrink-0 rounded-md shadow-2xl"
      />
      <div>
        <h4 className="text-xl font-bold mb-1 text-black dark:text-white">
          {title}
        </h4>
        <p className="text-neutral-700 text-sm max-w-40 dark:text-neutral-300">
          {description}
        </p>
      </div>
    </a>
  );
};

export const HoveredLink = ({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"a">) => {
  return (
    <a
      {...rest}
      className={[
        "text-neutral-700 dark:text-neutral-200 hover:text-black",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </a>
  );
};
