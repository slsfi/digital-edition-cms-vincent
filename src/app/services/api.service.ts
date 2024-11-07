import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient, private snackbar: MatSnackBar) {
    this.environment$.next(localStorage.getItem('environment') || null)
   }

  environment$ = new BehaviorSubject<string|null>(null);
  prefix: string = 'digitaledition';

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

  handleError(error: HttpErrorResponse, disableErrorMessage: boolean = false) {
    if (!disableErrorMessage) {
      const message = error.error.message || error.error.msg || error.message || 'An error occurred';
      this.snackbar.open(message, 'Close', { panelClass: 'snackbar-error', duration: undefined });
    }
    return throwError(() => error);
  }

  post(url: string, body?: any, options: any = {}, disableErrorMessage: boolean = false) {
    return this.http.post(url, body, options)
      .pipe(
        map((response: any) => response),
        catchError((error) => this.handleError(error, disableErrorMessage))
      )
  }

  get(url: string, options: any = {}, disableErrorMessage: boolean = false) {
    return this.http.get(url, options)
      .pipe(
        map((response: any) => response),
        catchError((error) => this.handleError(error, disableErrorMessage))
      )
  }

}
