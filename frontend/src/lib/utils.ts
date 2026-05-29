import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Canonical shadcn class-name helper: clsx + tailwind-merge.
 * Use this everywhere you'd otherwise interpolate template strings of Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
