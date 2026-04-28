import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, throwError } from 'rxjs';

import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly snackbar = inject(SnackbarService);

  constructor() {
    this.environment$.next(localStorage.getItem('environment') || null)
   }

  environment$ = new BehaviorSubject<string|null>(null);
  prefix = 'digitaledition';

  setEnvironment(env: string | null) {
    this.environment$.next(env);
    if (env != null) {
      localStorage.setItem('environment', env);
      return;
    }

    localStorage.removeItem('environment');
  }

  get environment() {
    return this.environment$.value || localStorage.getItem('environment') || '';
  }

  get prefixedUrl(): string {
    return `${this.environment}${this.prefix}`;
  }

  handleError(error: HttpErrorResponse, disableErrorMessage = false) {
    if (!disableErrorMessage) {
      const message = this.getErrorMessage(error);
      this.snackbar.show(message, 'error');
    }
    return throwError(() => error);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network error. Check your internet or VPN connection and try again.';
    }

    const backendMessage = this.getBackendErrorMessage(error.error);
    return backendMessage || error.message || 'An error occurred';
  }

  private getBackendErrorMessage(errorBody: unknown): string | null {
    if (typeof errorBody === 'string') {
      return errorBody.trim() || null;
    }

    if (typeof errorBody !== 'object' || errorBody === null) {
      return null;
    }

    const { message, msg } = errorBody as { message?: unknown; msg?: unknown };
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }

    return null;
  }

  post<T>(url: string, body?: object | null, options: object = {}, disableErrorMessage = false) {
    return this.http.post<T>(url, body, options).pipe(
      map((response) => response),
      catchError(
        (error: HttpErrorResponse) => this.handleError(error, disableErrorMessage)
      )
    )
  }

  get<T>(url: string, options: object = {}, disableErrorMessage = false) {
    return this.http.get<T>(url, options).pipe(
      map((response) => response),
      catchError(
        (error: HttpErrorResponse) => this.handleError(error, disableErrorMessage)
      )
    )
  }

  put<T>(url: string, body?: object | null, options: object = {}, disableErrorMessage = false) {
    return this.http.put<T>(url, body, options).pipe(
      map((response) => response),
      catchError(
        (error: HttpErrorResponse) => this.handleError(error, disableErrorMessage)
      )
    )
  }

}
