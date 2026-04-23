import { DefaultUrlSerializer, Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { AuthRedirectStorageService } from './auth-redirect-storage.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { LoginResponse, RefreshTokenResponse } from '../models/login.model';

describe('AuthService', () => {
  let router: jasmine.SpyObj<Pick<Router, 'navigateByUrl' | 'parseUrl'>>;
  let redirectStorage: jasmine.SpyObj<Pick<AuthRedirectStorageService, 'consumeReturnUrl' | 'clearReturnUrl' | 'storeReturnUrl'>>;
  let apiService: jasmine.SpyObj<Pick<ApiService, 'get' | 'post' | 'setEnvironment'>> & { environment: string | null };
  let projectService: jasmine.SpyObj<Pick<ProjectService, 'setSelectedProject'>>;
  let environment: string | null;

  function createService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    environment = 'https://api.sls.fi/';
    const urlSerializer = new DefaultUrlSerializer();

    router = jasmine.createSpyObj<Pick<Router, 'navigateByUrl' | 'parseUrl'>>('Router', ['navigateByUrl', 'parseUrl']);
    router.navigateByUrl.and.resolveTo(true);
    router.parseUrl.and.callFake((url: string): UrlTree => urlSerializer.parse(url));
    Object.defineProperty(router, 'url', { value: '/login', writable: true });

    redirectStorage = jasmine.createSpyObj<
      Pick<AuthRedirectStorageService, 'consumeReturnUrl' | 'clearReturnUrl' | 'storeReturnUrl'>
    >('AuthRedirectStorageService', ['consumeReturnUrl', 'clearReturnUrl', 'storeReturnUrl']);
    redirectStorage.consumeReturnUrl.and.returnValue(null);
    redirectStorage.storeReturnUrl.and.returnValue(true);

    apiService = jasmine.createSpyObj<Pick<ApiService, 'get' | 'post' | 'setEnvironment'>>(
      'ApiService',
      ['get', 'post', 'setEnvironment']
    ) as jasmine.SpyObj<Pick<ApiService, 'get' | 'post' | 'setEnvironment'>> & { environment: string | null };
    Object.defineProperty(apiService, 'environment', {
      get: () => environment
    });
    apiService.setEnvironment.and.callFake((env: string | null) => {
      environment = env;
    });

    projectService = jasmine.createSpyObj<Pick<ProjectService, 'setSelectedProject'>>('ProjectService', ['setSelectedProject']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthRedirectStorageService, useValue: redirectStorage },
        { provide: ApiService, useValue: apiService },
        { provide: ProjectService, useValue: projectService }
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('requires both access and refresh tokens to initialize as authenticated', () => {
    localStorage.setItem('access_token', 'existing-access-token');

    const service = createService();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
  });

  it('stores tokens and redirects to stored marker URL after successful login', () => {
    (router as unknown as { url: string }).url = '/login?rt=1&returnUrl=%2Fignored';
    redirectStorage.consumeReturnUrl.and.returnValue('/projects');
    apiService.post.and.returnValue(of<LoginResponse>({
      access_token: 'access-token-1',
      refresh_token: 'refresh-token-1',
      msg: 'ok',
      user_projects: []
    }));
    const service = createService();

    service.login(' user@example.com ', 'secret');

    expect(localStorage.getItem('access_token')).toBe('access-token-1');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token-1');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.loginError()).toBeNull();
    expect(service.loginInProgress()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/projects');
  });

  it('clears auth state and maps login failures without clearing the chosen environment', () => {
    localStorage.setItem('access_token', 'stale-access-token');
    localStorage.setItem('refresh_token', 'stale-refresh-token');
    apiService.post.and.returnValue(throwError(() => ({ status: 401 })));
    const service = createService();

    service.login('user@example.com', 'wrong-password');

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.loginError()).toBe('invalid_credentials');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
  });

  it('deduplicates in-flight session validation and reuses the fresh result within the TTL', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    const validationSubject = new Subject<{ authenticated?: boolean }>();
    apiService.get.and.returnValue(validationSubject.asObservable());
    const service = createService();
    let firstResult: boolean | undefined;
    let secondResult: boolean | undefined;
    let cachedResult: boolean | undefined;

    service.validateSessionIfStale(0).subscribe((result) => {
      firstResult = result;
    });
    service.validateSessionIfStale(0).subscribe((result) => {
      secondResult = result;
    });

    expect(apiService.get).toHaveBeenCalledTimes(1);

    validationSubject.next({ authenticated: true });
    validationSubject.complete();

    expect(firstResult).toBeTrue();
    expect(secondResult).toBeTrue();

    apiService.get.calls.reset();
    service.validateSessionIfStale().subscribe((result) => {
      cachedResult = result;
    });

    expect(cachedResult).toBeTrue();
    expect(apiService.get).not.toHaveBeenCalled();
  });

  it('clears auth state on session validation 401 without clearing the chosen environment', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    apiService.get.and.returnValue(throwError(() => ({ status: 401 })));
    const service = createService();
    let receivedError: { status?: number } | undefined;

    service.validateSessionIfStale(0).subscribe({
      next: () => fail('expected validation to fail'),
      error: (error) => {
        receivedError = error;
      }
    });

    expect(receivedError?.status).toBe(401);
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
    expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
  });

  it('fails fast when the refresh token is missing and logs out', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    const service = createService();
    localStorage.removeItem('refresh_token');
    let receivedError: unknown;

    service.refreshToken().subscribe({
      next: () => fail('expected refreshToken() to error'),
      error: (error) => {
        receivedError = error;
      }
    });

    expect(receivedError).toEqual(jasmine.any(Error));
    expect(apiService.post).not.toHaveBeenCalled();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
    expect(service.isAuthenticated()).toBeFalse();
    expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
  });

  it('uses a single refresh request for concurrent callers and resolves both', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    const refreshSubject = new Subject<RefreshTokenResponse>();
    apiService.post.and.returnValue(refreshSubject.asObservable());
    const service = createService();
    let firstResult: string | undefined;
    let secondResult: string | undefined;

    service.refreshToken().subscribe((token) => {
      firstResult = token;
    });
    service.refreshToken().subscribe((token) => {
      secondResult = token;
    });

    expect(apiService.post).toHaveBeenCalledTimes(1);

    refreshSubject.next({
      msg: 'ok',
      access_token: 'access-token-2'
    });
    refreshSubject.complete();

    expect(firstResult).toBe('access-token-2');
    expect(secondResult).toBe('access-token-2');
    expect(localStorage.getItem('access_token')).toBe('access-token-2');
  });

  it('propagates refresh failures to concurrent waiters and clears auth state', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    const refreshSubject = new Subject<RefreshTokenResponse>();
    apiService.post.and.returnValue(refreshSubject.asObservable());
    const service = createService();
    let firstError: { status?: number } | undefined;
    let secondError: { status?: number } | undefined;

    service.refreshToken().subscribe({
      next: () => fail('expected first refresh subscriber to error'),
      error: (error) => {
        firstError = error;
      }
    });
    service.refreshToken().subscribe({
      next: () => fail('expected second refresh subscriber to error'),
      error: (error) => {
        secondError = error;
      }
    });

    refreshSubject.error({ status: 401 });

    expect(firstError?.status).toBe(401);
    expect(secondError?.status).toBe(401);
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
    expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
  });

  it('preserves forced re-authentication targets through marker-based redirect storage', () => {
    const service = createService();

    const queryParams = service.preserveReturnUrlForReauthentication('/projects/42?tab=images');

    expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
    expect(redirectStorage.storeReturnUrl).toHaveBeenCalledWith('/projects/42?tab=images');
    expect(queryParams).toEqual({ rt: '1' });
  });

  it('falls back to returnUrl when redirect storage is unavailable during forced re-authentication', () => {
    redirectStorage.storeReturnUrl.and.returnValue(false);
    const service = createService();

    const queryParams = service.preserveReturnUrlForReauthentication('/projects/42?tab=images');

    expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
    expect(queryParams).toEqual({ returnUrl: '/projects/42?tab=images' });
  });

  it('explicit logout clears the chosen environment and any stored redirect target', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    const service = createService();

    service.logout();

    expect(apiService.setEnvironment).toHaveBeenCalledWith(null);
    expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
  });

  it('session expiry clears auth state while preserving the chosen environment and redirect target', () => {
    localStorage.setItem('access_token', 'access-token-1');
    localStorage.setItem('refresh_token', 'refresh-token-1');
    const service = createService();

    service.expireSession();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(apiService.setEnvironment).not.toHaveBeenCalled();
    expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
  });
});
