import { TestBed } from '@angular/core/testing';
import { CanActivateFn, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';

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
  let validateSessionIfStale: jasmine.Spy<() => unknown>;
  let authRedirectStorage: jasmine.SpyObj<Pick<AuthRedirectStorageService, 'storeReturnUrl' | 'consumeReturnUrl'>>;

  function asUrl(value: unknown): string | null {
    return value instanceof UrlTree ? value.toString() : null;
  }

  async function resolveGuardResult(result: unknown): Promise<unknown> {
    if (result instanceof Promise) {
      return result;
    }

    if (isObservable(result)) {
      return firstValueFrom(result);
    }

    return result;
  }

  function runGuard(url: string): unknown {
    return executeGuard({} as any, { url } as any);
  }

  beforeEach(() => {
    isAuthenticated = false;
    validateSessionIfStale = jasmine.createSpy('validateSessionIfStale').and.returnValue(of(true));
    authRedirectStorage = jasmine.createSpyObj<
      Pick<AuthRedirectStorageService, 'storeReturnUrl' | 'consumeReturnUrl'>
    >('AuthRedirectStorageService', ['storeReturnUrl', 'consumeReturnUrl']);
    authRedirectStorage.storeReturnUrl.and.returnValue(true);
    authRedirectStorage.consumeReturnUrl.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => isAuthenticated,
            validateSessionIfStale
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
    expect(validateSessionIfStale).not.toHaveBeenCalled();
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

  it('validates stale sessions for authenticated protected routes', async () => {
    isAuthenticated = true;

    const result = runGuard('/projects');

    expect(await resolveGuardResult(result)).toBe(true);
    expect(validateSessionIfStale).toHaveBeenCalledTimes(1);
  });

  it('redirects to /login when session validation fails with 401', async () => {
    isAuthenticated = true;
    validateSessionIfStale.and.returnValue(throwError(() => ({ status: 401 })));

    const result = runGuard('/projects');
    const resolvedResult = await resolveGuardResult(result);

    expect(resolvedResult).toEqual(jasmine.any(UrlTree));
    expect(authRedirectStorage.storeReturnUrl).toHaveBeenCalledWith('/projects');
    expect(asUrl(resolvedResult)).toBe(`/login?${AUTH_REDIRECT_MARKER_QUERY_PARAM}=${AUTH_REDIRECT_MARKER_VALUE}`);
  });

  it('fails open when session validation fails with a non-401 error', async () => {
    isAuthenticated = true;
    validateSessionIfStale.and.returnValue(throwError(() => ({ status: 503 })));

    const result = runGuard('/projects');

    expect(await resolveGuardResult(result)).toBe(true);
    expect(authRedirectStorage.storeReturnUrl).not.toHaveBeenCalled();
  });
});
