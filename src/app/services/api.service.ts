import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
    this.environment$.next(localStorage.getItem('environment') || null)
   }

  environment$ = new BehaviorSubject<string|null>(null);
  prefix: string = '/digitaledition';

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

  post(url: string, body: any, options: any = {}) {
    return this.http.post(url, body, options)
      .pipe(
        map((response: any) => response),
        catchError((error) => {
          throw error;
        })
      )
  }

  get(url: string, options: any = {}) {
    return this.http.get(url, options)
      .pipe(
        map((response: any) => response),
        catchError((error) => {
          console.error("get error", error);
          throw error;
        })
      )
  }

}
