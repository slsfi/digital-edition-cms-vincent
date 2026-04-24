import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Authentication interceptor for CMS API traffic.
 *
 * It only injects CMS bearer tokens into requests targeting the currently
 * selected backend, skips `/auth/*` endpoints, preserves caller-supplied
 * Authorization headers, and retries backend 401s through the refresh-token
 * flow before redirecting to `/login` on terminal auth failure. In the CMS,
 * any refresh-endpoint failure is treated as terminal, including malformed or
 * stale-token responses such as `422`. Forced re-authentication preserves the
 * current safe internal route so a successful login can resume the interrupted
 * CMS page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();
  const isBackendRequest = authService.isRequestToConfiguredBackend(req.url);
  const isAuthEndpoint = isBackendRequest && authService.isRequestToAuthEndpoint(req.url);
  const hasAuthorizationHeader = req.headers.has('Authorization');
  const shouldAttachAccessToken = !!authToken && isBackendRequest && !isAuthEndpoint && !hasAuthorizationHeader;
  const shouldParticipateInRefreshFlow = shouldAttachAccessToken;
  let authReq = req;

  if (shouldAttachAccessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((err) => {
      const isBackendUnauthorized = err.status === 401 && isBackendRequest && !isAuthEndpoint;
      if (isBackendUnauthorized) {
        const hasRefreshToken = !!authService.getRefreshToken();
        if (hasRefreshToken && shouldParticipateInRefreshFlow) {
          return authService.refreshToken().pipe(
            switchMap((access_token) => {
              const newAuthReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${access_token}`
                }
              });
              return next(newAuthReq);
            }),
            catchError((refreshError) => {
              redirectToLoginForReauthentication(router, authService);
              return throwError(() => refreshError);
            })
          );
        }

        if (shouldParticipateInRefreshFlow) {
          redirectToLoginForReauthentication(router, authService);
        }
      }

      return throwError(() => err);
    })
  );
};

/**
 * Ends the current authenticated CMS session and redirects to `/login` while
 * preserving the current route for one-time post-login restoration when safe.
 */
function redirectToLoginForReauthentication(router: Router, authService: AuthService): void {
  const queryParams = authService.preserveReturnUrlForReauthentication(router.url);
  authService.expireSession();
  router.navigate(['/login'], {
    replaceUrl: true,
    queryParams
  });
}
