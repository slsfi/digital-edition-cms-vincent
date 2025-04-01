import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, map, Observable, take, throwError } from 'rxjs';

import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../models/login';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
    private router: Router,
    private projectService: ProjectService
  ) {
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
    this.apiService.post<LoginResponse>(url, body)
      .subscribe({
        next: (response) => {
          const { access_token, refresh_token } = response;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          this.router.navigate(['/']);
          this.isAuthenticated$.next(true);
        },
        error: () => {
          this.logout();
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
      return this.apiService.post<RefreshTokenResponse>(url, null, { headers }).pipe(
        map((response) => {
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
    this.projectService.selectedProject$.next(null);
    this.isAuthenticated$.next(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }
}
