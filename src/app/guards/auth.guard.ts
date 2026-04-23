import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthRedirectStorageService } from '../services/auth-redirect-storage.service';
import { createLoginRedirectQueryParams, isLoginRouteURL,
         resolveLoginRouteRedirectURL } from '../services/auth-redirect-url.utils';
import { AuthService } from '../services/auth.service';

/**
 * Route guard for CMS authentication.
 *
 * It keeps unauthenticated users out of protected routes, preserves safe
 * post-login redirect targets, redirects authenticated users away from the
 * login page, and validates stale authenticated sessions against the backend.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authRedirectStorage = inject(AuthRedirectStorageService);
  const isAuthenticated = authService.isAuthenticated();
  const isLoginRoute = isLoginRouteURL(state.url);

  if (isLoginRoute) {
    if (!isAuthenticated) {
      return true;
    }

    const loginRouteRedirectURL = resolveLoginRouteRedirectURL(router, authRedirectStorage, state.url);
    return loginRouteRedirectURL
      ? router.parseUrl(loginRouteRedirectURL)
      : router.createUrlTree(['/']);
  }

  if (!isAuthenticated) {
    return createLoginRedirectUrlTree(router, authRedirectStorage, state.url);
  }

  return authService.validateSessionIfStale().pipe(
    map(() => true),
    catchError((error) => {
      if ((error as { status?: unknown } | null)?.status === 401) {
        return of(createLoginRedirectUrlTree(router, authRedirectStorage, state.url));
      }

      return of(true);
    })
  );
};

/**
 * Builds the redirect target for unauthenticated access to a protected route.
 *
 * Safe internal targets are stored for one-time post-login use when possible.
 * If redirect storage is unavailable, the guard falls back to a `returnUrl`
 * query parameter on `/login`.
 */
function createLoginRedirectUrlTree(
  router: Router,
  authRedirectStorage: AuthRedirectStorageService,
  targetUrl: string
): UrlTree {
  return router.createUrlTree(['/login'], {
    queryParams: createLoginRedirectQueryParams(router, authRedirectStorage, targetUrl)
  });
}
