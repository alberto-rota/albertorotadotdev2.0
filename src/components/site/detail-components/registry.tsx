"use client";

import type { ComponentType } from "react";
import type { Product } from "../types";
import { UnReflectDemo } from "./UnReflectDemo";
import { GroundControlTerminal } from "./GroundControlTerminal";

export type DetailComponentProps = {
  product: Product;
};

/**
 * Registry of custom detail components.
 *
 * To add a new one:
 *   1. Create a file next to this one (e.g. `MyProjectDemo.tsx`).
 *   2. Export a React component that accepts `{ product: Product }`.
 *   3. Add an entry below with a stable slug.
 *   4. Reference that slug from `src/data/products.json` via `detailComponent: "my-slug"`.
 */
const REGISTRY: Record<string, ComponentType<DetailComponentProps>> = {
  "unreflect-demo": UnReflectDemo,
  "ground-control-terminal": GroundControlTerminal,
};

export function getDetailComponent(
  slug: string | undefined
): ComponentType<DetailComponentProps> | null {
  if (!slug) return null;
  return REGISTRY[slug] ?? null;
}
