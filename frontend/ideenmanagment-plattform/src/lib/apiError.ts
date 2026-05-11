import { toast } from 'sonner';
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import { extractProblem } from '@/api/client';
import type { ProblemDetailsError } from '@/types/api';

/**
 * Mappt ProblemDetails auf ein RHF-Form.
 * - errors-Map → setError pro Feld
 * - sonst → Toast
 */
export function handleApiError<T extends FieldValues>(
  error: unknown,
  setError?: UseFormSetError<T>,
): ProblemDetailsError {
  const problem = extractProblem(error);
  let mapped = false;
  if (setError && problem.errors) {
    for (const [field, msgs] of Object.entries(problem.errors)) {
      const key = field.charAt(0).toLowerCase() + field.slice(1);
      try {
        setError(key as Path<T>, { type: 'server', message: msgs.join(' ') });
        mapped = true;
      } catch {
        /* ignore unknown fields */
      }
    }
  }
  if (!mapped) {
    toast.error(problem.title || 'Fehler', { description: problem.detail });
  }
  return problem;
}

