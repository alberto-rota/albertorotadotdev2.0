"use client";
import * as React from "react";
import NextImage from "next/image";
import * as LucideIcons from "lucide-react";
import { shouldBypassImageOptimization } from "@/lib/utils";

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

export function isImagePath(v: string): boolean {
  return IMAGE_EXT_RE.test(v);
}

type LucideIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { "aria-hidden"?: boolean }
>;

/** Resolves either a Lucide icon name or an image path. */
export function Icon({
  name,
  size = 18,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  if (!name) return null;

  if (isImagePath(name)) {
    return (
      <NextImage
        src={name}
        alt=""
        width={size}
        height={size}
        className={className}
        unoptimized={shouldBypassImageOptimization(name)}
      />
    );
  }

  const Component = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name];
  if (!Component) return null;
  return <Component className={className} width={size} height={size} aria-hidden={true} />;
}
