import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const authToken = authService.getAccessToken();
  let authReq = req;
  if (authToken && !req.url.includes('/auth/')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
  }
  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
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
      return throwError(() => err);
    })
  );
};
