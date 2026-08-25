import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True when the image source points to an external URL instead of a local asset. */
export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//i.test(src)
}

/**
 * Value for next/image's `unoptimized`: remote URLs skip the built-in
 * optimizer (no domain whitelist needed) and SVGs are served as-is.
 */
export function shouldBypassImageOptimization(src: string): boolean {
  return isRemoteImage(src) || src.toLowerCase().endsWith(".svg")
}
