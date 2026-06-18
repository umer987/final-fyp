import type { UserProfile } from './api';

/** Prefer Google display name, then name, then email local-part. */
export function getUserDisplayName(user: UserProfile | null | undefined): string {
  if (!user) return '';
  const display =
    user.displayName?.trim() ||
    user.name?.trim() ||
    user.email?.split('@')[0]?.trim();
  return display || user.email || 'User';
}

export function getUserPhotoUrl(user: UserProfile | null | undefined): string | null {
  if (!user) return null;
  return user.photoURL || user.picture || null;
}
