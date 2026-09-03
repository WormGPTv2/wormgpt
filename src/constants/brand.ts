/**
 * WormGPT brand identity — single source of truth for the product name,
 * tagline, accent color, and wordmark art used across the TUI.
 *
 * The accent is the gitlawb red. Theme entries derived from it MUST stay
 * in `rgb(r,g,b)` form (never hex): the spinner's shimmer/stall interpolation
 * parses theme values with `parseRGB`, which only matches `rgb(...)` strings.
 */

export const BRAND_NAME = 'WormGPT'

export const BRAND_TAGLINE = 'Burrow into any LLM'

/** gitlawb red (#dc2828) in the rgb() form required by theme consumers. */
export const BRAND_ACCENT_RGB = 'rgb(220,40,40)'

/**
 * Two-row Unicode half-block wordmark, split so the two halves can be
 * rendered in different accent shades. Block characters (█ ▀ ▄) render
 * correctly in Apple Terminal. Rendered side by side with a 1-col gap:
 *
 *   █▀█ █▀█ █▀█ ▄█▄  █▀▀ ▀▀▀ █▀█
 *   ▄█▄ █▄█ █▄▀ █▀█  █▄█  █  █▀▀
 */
export const WORDMARK_WORM = [
  '█▀█ █▀█ █▀█ ▄█▄',
  '▄█▄ █▄█ █▄▀ █▀█',
] as const

export const WORDMARK_GPT = [
  '█▀▀ █▀█ ▀▀▀',
  '█▄█ █▀▀  █',
] as const

/** Rendered width of the full wordmark: worm half + 1-col gap + gpt half. */
export const WORDMARK_WIDTH =
  WORDMARK_WORM[0].length + 1 + WORDMARK_GPT[0].length
