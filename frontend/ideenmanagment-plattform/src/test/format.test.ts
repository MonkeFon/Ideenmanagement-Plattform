import { describe, expect, it } from 'vitest';
import { formatFileSize, IDEA_STATUS_LABEL } from '@/lib/format';

describe('format helpers', () => {
  it('formatFileSize formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
  it('IDEA_STATUS_LABEL covers all statuses', () => {
    expect(IDEA_STATUS_LABEL.Draft).toBe('Entwurf');
    expect(IDEA_STATUS_LABEL.Approved).toBe('Genehmigt');
  });
});

