import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Canonical shadcn class-name helper: clsx + tailwind-merge.
 * Use this everywhere you'd otherwise interpolate template strings of Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A cosine-similarity score (0–1) as a whole-number percent, clamped to 0–100.
 * The clamp guards the display: a raw score can edge slightly past 1.0, and a
 * "124 %" match reads as a bug — a similarity is at most a 100 % match.
 */
export function simPct(similarity: number | null | undefined): number {
  return Math.max(0, Math.min(100, Math.round((similarity ?? 0) * 100)))
}
