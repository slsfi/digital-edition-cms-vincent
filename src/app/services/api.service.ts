import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  $environment = new BehaviorSubject<string|null>(null);
  prefix: string = '/digitaledition';
  $loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  setEnvironment(env: string | null) {
    this.$environment.next(env);
    if (env != null) {
      localStorage.setItem('environment', env);
    }
  }

  get environment() {
    return this.$environment.value || localStorage.getItem('environment') || '';
  }

  get prefixedUrl(): string {
    return `${this.environment}${this.prefix}`;
  }

  post(url: string, body: any, options: any = {}) {
    this.$loading.next(true);
    return this.http.post(url, body, options)
    .pipe(
      map((response: any) => {
        // console.log("post result", response);
        this.$loading.next(false);
        return response;
      }),
      catchError((error) => {
        console.error("post error", error);
        this.$loading.next(false);
        throw error;
      })
    )
  }

  get(url: string, options: any = {}) {
    this.$loading.next(true);
    return this.http.get(url, options)
    .pipe(
      map((response: any) => {
        // console.log("get result", response);
        this.$loading.next(false);
        return response;
      }),
      catchError((error) => {
        console.error("get error", error);
        this.$loading.next(false);
        throw error;
      })
    )
  }

}
