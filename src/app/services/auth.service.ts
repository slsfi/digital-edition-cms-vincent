import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private apiService: ApiService) {
    if (this.getAccessToken()) {
      this.$isAuthenticated.next(true);
    } else {
      this.$isAuthenticated.next(false);
    }
  }

  $isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  login(email: string, password: string) {
    const url = `${this.apiService.getEnvironment()}auth/login`;
    const body = { email, password };
    return this.apiService.post(url, body)
      .subscribe((response: any) => {
        const { access_token, msg, refresh_token, user_projects } = response;
        localStorage.setItem('access_token', JSON.stringify(access_token));
        localStorage.setItem('refresh_token', JSON.stringify(refresh_token));
        this.$isAuthenticated.next(true);
      });
  }

  refreshToken() {
    const url = `${this.apiService.getEnvironment()}auth/refresh`;
    const body = { refresh_token: this.getRefreshToken() };
    return this.apiService.post(url, body)
      .subscribe((response: any) => {
        const { access_token, refresh_token } = response;
        localStorage.setItem('access_token', JSON.stringify(access_token));
        localStorage.setItem('refresh_token', JSON.stringify(refresh_token));
      });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.$isAuthenticated.next(false);
  }

  getAccessToken() {
    const token = localStorage.getItem('access_token')
    if (token) {
      return JSON.parse(token);
    }
    return null;
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }
}
