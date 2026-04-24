import { Injectable } from '@angular/core';

const AUTH_REDIRECT_STORAGE_KEY = 'auth.returnUrl';

export const AUTH_REDIRECT_MARKER_QUERY_PARAM = 'rt';
export const AUTH_REDIRECT_MARKER_VALUE = '1';

/**
 * Session-scoped storage for one-time post-login redirect targets.
 *
 * The guard stores a safe internal target before redirecting an unauthenticated
 * user to `/login`. After successful login, the auth flow consumes that target
 * once so it cannot leak across later sessions or explicit logout/login cycles.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthRedirectStorageService {
  /**
   * Stores a post-login return URL for one-time use.
   *
   * Returns false when session storage is unavailable or throws.
   */
  storeReturnUrl(value: string): boolean {
    try {
      sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads and clears the stored return URL.
   *
   * Returns null when no value is stored or when storage access fails.
   */
  consumeReturnUrl(): string | null {
    try {
      const value = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      return value;
    } catch {
      return null;
    }
  }

  /**
   * Clears any stored post-login return URL.
   */
  clearReturnUrl(): void {
    try {
      sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
    } catch {
      // no-op
    }
  }
}
