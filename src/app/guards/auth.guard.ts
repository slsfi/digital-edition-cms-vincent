import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.$isAuthenticated.pipe(
    map((isAuthenticated) => {
      if (state.url === '/login') {
        if (isAuthenticated) {
          router.navigate(['/']);
          return false; // User is authenticated, redirect to home and block the route
        } else {
          return true; // User is not authenticated, allow access to login
        }
      } else {
        if (isAuthenticated) {
          return true; // User is authenticated, allow access
        } else {
          router.navigate(['/login']);
          return false; // User is not authenticated, redirect to login
        }
      }
    }
  ));
};
