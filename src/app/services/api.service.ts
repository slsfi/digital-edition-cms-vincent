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
    }
  }

  get environment() {
    return this.environment$.value || localStorage.getItem('environment') || '';
  }

  get prefixedUrl(): string {
    return `${this.environment}${this.prefix}`;
  }

  handleError(error: HttpErrorResponse, disableErrorMessage = false) {
    if (!disableErrorMessage) {
      const message = error.error.message || error.error.msg || error.message || 'An error occurred';
      this.snackbar.show(message, 'error');
    }
    return throwError(() => error);
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
