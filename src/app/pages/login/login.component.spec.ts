import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthService, LoginErrorCode } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let apiService: jasmine.SpyObj<Pick<ApiService, 'setEnvironment'>> & { environment: string };
  let authService: jasmine.SpyObj<Pick<AuthService, 'login' | 'clearLoginError'>> &
    Pick<AuthService, 'loginError' | 'loginInProgress'>;
  let environment: string;

  beforeEach(async () => {
    environment = '';
    apiService = jasmine.createSpyObj<Pick<ApiService, 'setEnvironment'>>(
      'ApiService',
      ['setEnvironment']
    ) as jasmine.SpyObj<Pick<ApiService, 'setEnvironment'>> & { environment: string };
    Object.defineProperty(apiService, 'environment', {
      get: () => environment
    });
    authService = jasmine.createSpyObj<Pick<AuthService, 'login' | 'clearLoginError'>>(
      'AuthService',
      ['login', 'clearLoginError']
    ) as jasmine.SpyObj<Pick<AuthService, 'login' | 'clearLoginError'>> &
      Pick<AuthService, 'loginError' | 'loginInProgress'>;
    Object.defineProperty(authService, 'loginError', {
      value: signal<LoginErrorCode | null>(null).asReadonly()
    });
    Object.defineProperty(authService, 'loginInProgress', {
      value: signal(false).asReadonly()
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiService },
        { provide: AuthService, useValue: authService },
        { provide: LoadingService, useValue: { loading$: of(false) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preselects a stored predefined environment', () => {
    environment = 'https://testa-api.sls.fi/';

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.environment.value).toBe('https://testa-api.sls.fi/');
  });

  it('preselects a stored custom environment', () => {
    environment = 'https://custom-api.example.com/';

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.environment.value).toBe(' ');
    expect(component.customEnvironment.value).toBe('https://custom-api.example.com/');
  });

  it('does not submit when the custom environment URL is invalid', () => {
    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'secret',
      environment: ' ',
      customEnvironment: 'not-a-url'
    });

    component.login();

    expect(component.customEnvironment.hasError('invalidEnvironment')).toBeTrue();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('does not submit when the custom environment URL uses http', () => {
    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'secret',
      environment: ' ',
      customEnvironment: 'http://example.com/custom'
    });

    component.login();

    expect(component.customEnvironment.hasError('invalidEnvironment')).toBeTrue();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('normalizes custom environment URLs and trims the login email before submitting', () => {
    component.loginForm.setValue({
      email: ' user@example.com ',
      password: 'secret',
      environment: ' ',
      customEnvironment: ' https://example.com/custom '
    });

    component.login();

    expect(apiService.setEnvironment).toHaveBeenCalledWith('https://example.com/custom/');
    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(component.customEnvironment.value).toBe('https://example.com/custom/');
  });

  it('clears the login error when the form value changes', () => {
    component.email.setValue('user@example.com');

    expect(authService.clearLoginError).toHaveBeenCalled();
  });
});
