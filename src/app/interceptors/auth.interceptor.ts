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
 * flow before redirecting to `/login` on terminal auth failure.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();
  const isBackendRequest = authService.isRequestToConfiguredBackend(req.url);
  const isAuthEndpoint = isBackendRequest && authService.isRequestToAuthEndpoint(req.url);
  const hasAuthorizationHeader = req.headers.has('Authorization');
  const shouldAttachAccessToken = !!authToken && isBackendRequest && !isAuthEndpoint && !hasAuthorizationHeader;
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
        if (hasRefreshToken) {
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
              if (refreshError.status === 401) {
                authService.logout();
                router.navigate(['/login'], { replaceUrl: true });
              }
              return throwError(() => refreshError);
            })
          );
        }

        if (shouldAttachAccessToken) {
          authService.logout();
          router.navigate(['/login'], { replaceUrl: true });
        }
      }

      return throwError(() => err);
    })
  );
};
