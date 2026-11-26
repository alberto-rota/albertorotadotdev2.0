import type { GlyphWord } from "./types";

/** The words the hero's glyph band spells. Set in `products.json` under `hero.glyph`. */
export type GlyphWords = { name: GlyphWord; intro: GlyphWord[]; topics: GlyphWord[] };

/** Used when `products.json` sets nothing, and for any part it leaves out. */
export const DEFAULT_GLYPH_WORDS: GlyphWords = {
  name: { text: "ALBERTO", hold: 7 },
  intro: [
    { text: "WHO AM I", hold: 2.5 },
    { text: "ALBERTO", hold: 2 },
    { text: "ROTA", hold: 1 },
  ],
  topics: [
    { text: "SURGICAL AI", hold: 3.2 },
    { text: "ROBOTICS", hold: 3.2 },
    { text: "VISION", hold: 3.2 },
    { text: "AWARENESS", hold: 3.2 },
  ],
};
