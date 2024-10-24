import { BehaviorSubject, catchError, filter, map, Observable, take, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { inject, Injectable } from '@angular/core';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../models/login';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private apiService: ApiService, private router: Router) {
    if (this.getAccessToken()) {
      this.isAuthenticated$.next(true);
    } else {
      this.isAuthenticated$.next(false);
    }
  }
  snackbar = inject(MatSnackBar);

  isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  login(email: string, password: string): void {
    const url = `${this.apiService.environment}auth/login`;
    const body: LoginRequest = { email, password };
    this.apiService.post(url, body)
      .subscribe({
        next: (response: LoginResponse) => {
          const { access_token, refresh_token, user_projects } = response;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          localStorage.setItem('user_projects', user_projects.join(','));
          this.router.navigate(['/']);
          this.isAuthenticated$.next(true);
        },
        error: (err) => {
          console.log(err);
          this.logout();
          this.snackbar.open('Failed: ' + err.error.msg, 'Close', { panelClass: 'snackbar-error' });
        }
      });
  }

  refreshToken(): Observable<string> {
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1)
      );
    } else {
      this.refreshTokenInProgress = true;
      const url = `${this.apiService.environment}auth/refresh`;
      const headers = { Authorization: `Bearer ${this.getRefreshToken()}` };
      return this.apiService.post(url, null, { headers }).pipe(
        map((response: RefreshTokenResponse) => {
          const { access_token } = response;
          localStorage.setItem('access_token', access_token);
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(access_token);
          return access_token;
        }),
        catchError((error) => {
          this.refreshTokenInProgress = false;
          this.logout();
          return throwError(() => error);
        })
      );
    }
  }

  logout(): void {
    localStorage.clear();
    this.apiService.setEnvironment(null);
    this.isAuthenticated$.next(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUserProjects(): string[] {
    const projects = localStorage.getItem('user_projects');
    if (projects) {
      return projects.split(',');
    }
    return [];
  }
}
