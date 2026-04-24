import { TestBed } from '@angular/core/testing';
import { CanActivateFn, UrlTree, provideRouter } from '@angular/router';

import {
  AUTH_REDIRECT_MARKER_QUERY_PARAM,
  AUTH_REDIRECT_MARKER_VALUE,
  AuthRedirectStorageService
} from '../services/auth-redirect-storage.service';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));
  let isAuthenticated = false;
  let authRedirectStorage: jasmine.SpyObj<
    Pick<AuthRedirectStorageService, 'storeReturnUrl' | 'consumeReturnUrl' | 'clearReturnUrl'>
  >;

  function asUrl(value: unknown): string | null {
    return value instanceof UrlTree ? value.toString() : null;
  }

  function runGuard(url: string): unknown {
    return executeGuard({} as any, { url } as any);
  }

  beforeEach(() => {
    isAuthenticated = false;
    authRedirectStorage = jasmine.createSpyObj<
      Pick<AuthRedirectStorageService, 'storeReturnUrl' | 'consumeReturnUrl' | 'clearReturnUrl'>
    >('AuthRedirectStorageService', ['storeReturnUrl', 'consumeReturnUrl', 'clearReturnUrl']);
    authRedirectStorage.storeReturnUrl.and.returnValue(true);
    authRedirectStorage.consumeReturnUrl.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => isAuthenticated
          }
        },
        { provide: AuthRedirectStorageService, useValue: authRedirectStorage }
      ]
    });
  });

  it('redirects protected routes to /login and stores the intended target when unauthenticated', () => {
    const result = runGuard('/projects');

    expect(authRedirectStorage.storeReturnUrl).toHaveBeenCalledWith('/projects');
    expect(asUrl(result)).toBe(`/login?${AUTH_REDIRECT_MARKER_QUERY_PARAM}=${AUTH_REDIRECT_MARKER_VALUE}`);
  });

  it('falls back to the legacy returnUrl query param when redirect storage fails', () => {
    authRedirectStorage.storeReturnUrl.and.returnValue(false);

    const result = runGuard('/projects');

    expect(asUrl(result)).toBe('/login?returnUrl=%2Fprojects');
  });

  it('allows the login route when unauthenticated', () => {
    const result = runGuard('/login');

    expect(result).toBe(true);
    expect(authRedirectStorage.consumeReturnUrl).not.toHaveBeenCalled();
  });

  it('redirects authenticated login visits to the stored marker URL', () => {
    isAuthenticated = true;
    authRedirectStorage.consumeReturnUrl.and.returnValue('/projects');

    const result = runGuard(`/login?${AUTH_REDIRECT_MARKER_QUERY_PARAM}=${AUTH_REDIRECT_MARKER_VALUE}`);

    expect(authRedirectStorage.consumeReturnUrl).toHaveBeenCalledTimes(1);
    expect(asUrl(result)).toBe('/projects');
  });

  it('redirects authenticated login visits to the safe query returnUrl when no marker target exists', () => {
    isAuthenticated = true;

    const result = runGuard('/login?returnUrl=%2Fprojects');

    expect(asUrl(result)).toBe('/projects');
  });

  it('falls back to / when the authenticated login redirect target is unsafe', () => {
    isAuthenticated = true;

    const result = runGuard('/login?returnUrl=%2F%2Fevil.example');

    expect(asUrl(result)).toBe('/');
  });

  it('allows protected routes when already authenticated', () => {
    isAuthenticated = true;

    const result = runGuard('/projects');

    expect(result).toBe(true);
    expect(authRedirectStorage.storeReturnUrl).not.toHaveBeenCalled();
  });
});
