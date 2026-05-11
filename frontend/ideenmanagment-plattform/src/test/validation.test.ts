import { describe, expect, it } from 'vitest';
import { ideaSchema, loginSchema, passwordSchema } from '@/lib/validation';

describe('zod validation schemas', () => {
  it('passwordSchema enforces complexity', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('alllowercase1!').success).toBe(false);
    expect(passwordSchema.safeParse('Strong1!').success).toBe(true);
  });

  it('loginSchema requires both fields', () => {
    expect(loginSchema.safeParse({ emailOrUserName: '', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ emailOrUserName: 'a', password: 'b' }).success).toBe(true);
  });

  it('ideaSchema enforces lengths', () => {
    expect(ideaSchema.safeParse({ title: 'abc', description: 'short', categoryId: 'c1' }).success).toBe(false);
    expect(
      ideaSchema.safeParse({
        title: 'gültiger Titel',
        description: 'ausreichende Beschreibung',
        categoryId: 'c1',
      }).success,
    ).toBe(true);
  });
});

