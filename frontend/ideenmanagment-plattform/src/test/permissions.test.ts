import { describe, expect, it } from 'vitest';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  hasRole,
} from '@/lib/permissions';

describe('permissions helpers', () => {
  const perms = ['ideas.create', 'ideas.read'];

  it('hasPermission true for matching code', () => {
    expect(hasPermission(perms, 'ideas.read')).toBe(true);
    expect(hasPermission(perms, 'roles.manage')).toBe(false);
  });

  it('hasAnyPermission matches one', () => {
    expect(hasAnyPermission(perms, ['roles.manage', 'ideas.read'])).toBe(true);
    expect(hasAnyPermission(perms, ['roles.manage'])).toBe(false);
  });

  it('hasAllPermissions requires all', () => {
    expect(hasAllPermissions(perms, ['ideas.create', 'ideas.read'])).toBe(true);
    expect(hasAllPermissions(perms, ['ideas.create', 'roles.manage'])).toBe(false);
  });

  it('hasRole checks role list', () => {
    expect(hasRole(['Admin'], 'Admin')).toBe(true);
    expect(hasRole(undefined, 'Admin')).toBe(false);
  });
});

