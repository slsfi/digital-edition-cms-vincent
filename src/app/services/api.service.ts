import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient, private snackbar: MatSnackBar) {
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
      this.snackbar.open(message, 'Close', { panelClass: 'snackbar-error', duration: undefined });
    }
    return throwError(() => error);
  }

  post<T>(url: string, body?: object | null, options: object = {}, disableErrorMessage = false) {
    return this.http.post<T>(url, body, options)
      .pipe(
        map((response) => response),
        catchError((error: HttpErrorResponse) => this.handleError(error, disableErrorMessage))
      )
  }

  get<T>(url: string, options: object = {}, disableErrorMessage = false) {
    return this.http.get<T>(url, options)
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error, disableErrorMessage))
      )
  }

}
