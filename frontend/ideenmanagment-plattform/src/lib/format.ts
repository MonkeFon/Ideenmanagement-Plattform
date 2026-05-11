import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { IdeaStatus } from '@/types/api';

export function toDate(input: string | Date): Date {
  return input instanceof Date ? input : parseISO(input);
}

export function formatRelative(input: string | Date | null | undefined): string {
  if (!input) return '–';
  try {
    return formatDistanceToNow(toDate(input), { addSuffix: true, locale: de });
  } catch {
    return '–';
  }
}

export function formatAbsolute(
  input: string | Date | null | undefined,
  pattern = 'dd.MM.yyyy HH:mm',
): string {
  if (!input) return '–';
  try {
    return format(toDate(input), pattern, { locale: de });
  } catch {
    return '–';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let i = -1;
  let size = bytes;
  do {
    size /= 1024;
    i++;
  } while (size >= 1024 && i < units.length - 1);
  return `${size.toFixed(1)} ${units[i]}`;
}

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  Draft: 'Entwurf',
  Submitted: 'Eingereicht',
  UnderReview: 'In Prüfung',
  Approved: 'Genehmigt',
  Rejected: 'Abgelehnt',
  Archived: 'Archiviert',
};

export const IDEA_STATUS_COLOR: Record<IdeaStatus, string> = {
  Draft: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  Submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  UnderReview: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  Approved: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
  Rejected: 'bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100',
  Archived: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
};

