import type { MockedObject } from "vitest";
import { DefaultUrlSerializer, Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { AuthRedirectStorageService } from './auth-redirect-storage.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { LoginResponse, RefreshTokenResponse } from '../models/login.model';

describe('AuthService', () => {
    let router: MockedObject<Pick<Router, 'navigateByUrl' | 'parseUrl'>>;
    let redirectStorage: MockedObject<Pick<AuthRedirectStorageService, 'consumeReturnUrl' | 'clearReturnUrl' | 'storeReturnUrl'>>;
    let apiService: MockedObject<Pick<ApiService, 'get' | 'post' | 'setEnvironment'>> & {
        environment: string | null;
    };
    let projectService: MockedObject<Pick<ProjectService, 'setSelectedProject' | 'restoreSelectedProjectForEnvironment' | 'getCurrentProject'>>;
    let environment: string | null;

    function createService(): AuthService {
        return TestBed.inject(AuthService);
    }

    function createAuthenticatedService(): AuthService {
        const service = createService();
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        service.isAuthenticated$.next(true);
        return service;
    }

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        environment = 'https://api.sls.fi/';
        const urlSerializer = new DefaultUrlSerializer();

        router = {
            navigateByUrl: vi.fn().mockName("Router.navigateByUrl"),
            parseUrl: vi.fn().mockName("Router.parseUrl")
        };
        router.navigateByUrl.mockResolvedValue(true);
        router.parseUrl.mockImplementation((url: string): UrlTree => urlSerializer.parse(url));
        Object.defineProperty(router, 'url', { value: '/login', writable: true });

        redirectStorage = {
            consumeReturnUrl: vi.fn().mockName("AuthRedirectStorageService.consumeReturnUrl"),
            clearReturnUrl: vi.fn().mockName("AuthRedirectStorageService.clearReturnUrl"),
            storeReturnUrl: vi.fn().mockName("AuthRedirectStorageService.storeReturnUrl")
        };
        redirectStorage.consumeReturnUrl.mockReturnValue(null);
        redirectStorage.storeReturnUrl.mockReturnValue(true);

        apiService = {
            get: vi.fn().mockName("ApiService.get"),
            post: vi.fn().mockName("ApiService.post"),
            setEnvironment: vi.fn().mockName("ApiService.setEnvironment")
        } as MockedObject<Pick<ApiService, 'get' | 'post' | 'setEnvironment'>> & {
            environment: string | null;
        };
        Object.defineProperty(apiService, 'environment', {
            get: () => environment
        });
        apiService.setEnvironment.mockImplementation((env: string | null) => {
            environment = env;
        });
        apiService.get.mockReturnValue(of({ authenticated: true }));

        projectService = {
            setSelectedProject: vi.fn().mockName("ProjectService.setSelectedProject"),
            restoreSelectedProjectForEnvironment: vi.fn().mockName("ProjectService.restoreSelectedProjectForEnvironment"),
            getCurrentProject: vi.fn().mockName("ProjectService.getCurrentProject")
        };
        projectService.restoreSelectedProjectForEnvironment.mockReturnValue(null);
        projectService.getCurrentProject.mockReturnValue(null);

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

        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
    });

    it('validates complete stored sessions before trusting them on app start', () => {
        localStorage.setItem('access_token', 'stored-access-token');
        localStorage.setItem('refresh_token', 'stored-refresh-token');
        const validationSubject = new Subject<{
            authenticated?: boolean;
        }>();
        apiService.get.mockReturnValue(validationSubject.asObservable());
        const service = createService();
        let result: boolean | undefined;

        expect(service.isAuthenticated()).toBe(false);
        expect(service.isInitialSessionValidationPending()).toBe(true);

        service.validateInitialSession().subscribe((validated) => {
            result = validated;
        });

        expect(apiService.get).toHaveBeenCalledWith('https://api.sls.fi/session/validate_cms', expect.objectContaining({
            headers: { Authorization: 'Bearer stored-access-token' }
        }), true);
        expect(result).toBeUndefined();

        validationSubject.next({ authenticated: true });
        validationSubject.complete();

        expect(result).toBe(true);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.isInitialSessionValidationPending()).toBe(false);
    });

    it('refreshes a stale stored access token before accepting an initial session', () => {
        localStorage.setItem('access_token', 'stale-access-token');
        localStorage.setItem('refresh_token', 'stored-refresh-token');
        apiService.get.mockReturnValueOnce(throwError(() => ({ status: 401 }))).mockReturnValueOnce(of({ authenticated: true }));
        apiService.post.mockReturnValue(of<RefreshTokenResponse>({
            msg: 'ok',
            access_token: 'refreshed-access-token'
        }));
        const service = createService();
        let result: boolean | undefined;

        service.validateInitialSession().subscribe((validated) => {
            result = validated;
        });

        expect(result).toBe(true);
        expect(localStorage.getItem('access_token')).toBe('refreshed-access-token');
        expect(service.isAuthenticated()).toBe(true);
        expect(apiService.get.mock.lastCall?.[1]).toEqual(expect.objectContaining({
            headers: { Authorization: 'Bearer refreshed-access-token' }
        }));
    });

    it('clears complete stored sessions when initial CMS validation fails', () => {
        localStorage.setItem('access_token', 'stored-access-token');
        localStorage.setItem('refresh_token', 'stored-refresh-token');
        apiService.get.mockReturnValue(throwError(() => ({ status: 500 })));
        const service = createService();
        let result: boolean | undefined;

        service.validateInitialSession().subscribe((validated) => {
            result = validated;
        });

        expect(result).toBe(false);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
        expect(service.isInitialSessionValidationPending()).toBe(false);
    });

    it('stores tokens and redirects to stored marker URL after successful login', () => {
        (router as unknown as {
            url: string;
        }).url = '/login?rt=1&returnUrl=%2Fignored';
        redirectStorage.consumeReturnUrl.mockReturnValue('/projects');
        apiService.post.mockReturnValue(of<LoginResponse>({
            access_token: 'access-token-1',
            refresh_token: 'refresh-token-1',
            msg: 'ok',
            user_projects: []
        }));
        const service = createService();

        service.login(' user@example.com ', 'secret');

        expect(localStorage.getItem('access_token')).toBe('access-token-1');
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token-1');
        expect(service.isAuthenticated()).toBe(true);
        expect(service.loginError()).toBeNull();
        expect(service.loginInProgress()).toBe(false);
        expect(apiService.get).toHaveBeenCalledWith('https://api.sls.fi/session/validate_cms', expect.objectContaining({
            headers: { Authorization: 'Bearer access-token-1' }
        }), true);
        expect(projectService.restoreSelectedProjectForEnvironment).toHaveBeenCalledWith('https://api.sls.fi/', []);
        expect(router.navigateByUrl).toHaveBeenCalledWith('/projects');
    });

    [401, 422].forEach((status) => {
        it(`keeps the user unauthenticated when post-login CMS validation returns ${status}`, () => {
            localStorage.setItem('access_token', 'stale-access-token');
            localStorage.setItem('refresh_token', 'stale-refresh-token');
            apiService.post.mockReturnValue(of<LoginResponse>({
                access_token: 'access-token-1',
                refresh_token: 'refresh-token-1',
                msg: 'ok',
                user_projects: ['project-a']
            }));
            apiService.get.mockReturnValue(throwError(() => ({ status })));
            const service = createService();

            service.login('user@example.com', 'secret');

            expect(apiService.get).toHaveBeenCalledWith('https://api.sls.fi/session/validate_cms', expect.objectContaining({
                headers: { Authorization: 'Bearer access-token-1' }
            }), true);
            expect(service.isAuthenticated()).toBe(false);
            expect(service.loginError()).toBe('cms_access_denied');
            expect(localStorage.getItem('access_token')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
            expect(apiService.setEnvironment).not.toHaveBeenCalled();
            expect(projectService.restoreSelectedProjectForEnvironment).not.toHaveBeenCalled();
            expect(router.navigateByUrl).not.toHaveBeenCalled();
        });
    });

    it('restores an environment-matched project before redirecting to a project route', () => {
        (router as unknown as {
            url: string;
        }).url = '/login?rt=1';
        redirectStorage.consumeReturnUrl.mockReturnValue('/facsimile-collections');
        projectService.restoreSelectedProjectForEnvironment.mockImplementation(() => {
            projectService.getCurrentProject.mockReturnValue('project-a');
            return 'project-a';
        });
        apiService.post.mockReturnValue(of<LoginResponse>({
            access_token: 'access-token-1',
            refresh_token: 'refresh-token-1',
            msg: 'ok',
            user_projects: ['project-a']
        }));
        const service = createService();

        service.login('user@example.com', 'secret');

        expect(projectService.restoreSelectedProjectForEnvironment).toHaveBeenCalledWith('https://api.sls.fi/', ['project-a']);
        expect(router.navigateByUrl).toHaveBeenCalledWith('/facsimile-collections');
    });

    it('sends users to the landing page when the return target needs a project but none was restored', () => {
        (router as unknown as {
            url: string;
        }).url = '/login?rt=1';
        redirectStorage.consumeReturnUrl.mockReturnValue('/facsimile-collections');
        apiService.post.mockReturnValue(of<LoginResponse>({
            access_token: 'access-token-1',
            refresh_token: 'refresh-token-1',
            msg: 'ok',
            user_projects: []
        }));
        const service = createService();

        service.login('user@example.com', 'secret');

        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('clears auth state and maps login failures without clearing the chosen environment', () => {
        localStorage.setItem('access_token', 'stale-access-token');
        localStorage.setItem('refresh_token', 'stale-refresh-token');
        apiService.post.mockReturnValue(throwError(() => ({ status: 401 })));
        const service = createService();

        service.login('user@example.com', 'wrong-password');

        expect(service.isAuthenticated()).toBe(false);
        expect(service.loginError()).toBe('invalid_credentials');
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(projectService.setSelectedProject).toHaveBeenCalledWith(null, { persist: false });
    });

    it('deduplicates in-flight session validation requests', () => {
        const validationSubject = new Subject<{
            authenticated?: boolean;
        }>();
        apiService.get.mockReturnValue(validationSubject.asObservable());
        const service = createAuthenticatedService();
        let firstResult: boolean | undefined;
        let secondResult: boolean | undefined;

        service.validateSession().subscribe((result) => {
            firstResult = result;
        });
        service.validateSession().subscribe((result) => {
            secondResult = result;
        });

        expect(apiService.get).toHaveBeenCalledTimes(1);
        expect(apiService.get.mock.lastCall?.[0]).toBe('https://api.sls.fi/session/validate_cms');

        validationSubject.next({ authenticated: true });
        validationSubject.complete();

        expect(firstResult).toBe(true);
        expect(secondResult).toBe(true);

        apiService.get.mockClear();
        apiService.get.mockReturnValue(of({ authenticated: true }));
        service.validateSession().subscribe((result) => {
            firstResult = result;
        });

        expect(firstResult).toBe(true);
        expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('clears auth state on any session validation error without clearing the chosen environment', () => {
        apiService.get.mockReturnValue(throwError(() => ({ status: 404 })));
        const service = createAuthenticatedService();
        let receivedError: {
            status?: number;
        } | undefined;

        service.validateSession().subscribe({
            next: () => expect.fail('expected validation to fail'),
            error: (error) => {
                receivedError = error;
            }
        });

        expect(receivedError?.status).toBe(404);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
    });

    it('clears auth state when session validation reports an unauthenticated session', () => {
        apiService.get.mockReturnValue(of({ authenticated: false }));
        const service = createAuthenticatedService();
        let receivedError: {
            status?: number;
        } | undefined;

        service.validateSession().subscribe({
            next: () => expect.fail('expected validation to fail'),
            error: (error) => {
                receivedError = error;
            }
        });

        expect(receivedError?.status).toBe(401);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
    });

    it('fails fast when the refresh token is missing and logs out', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        const service = createService();
        localStorage.removeItem('refresh_token');
        let receivedError: unknown;

        service.refreshToken().subscribe({
            next: () => expect.fail('expected refreshToken() to error'),
            error: (error) => {
                receivedError = error;
            }
        });

        expect(receivedError).toEqual(expect.any(Error));
        expect(apiService.post).not.toHaveBeenCalled();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(service.isAuthenticated()).toBe(false);
        expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
    });

    it('uses a single refresh request for concurrent callers and resolves both', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        const refreshSubject = new Subject<RefreshTokenResponse>();
        apiService.post.mockReturnValue(refreshSubject.asObservable());
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
        expect(apiService.get).toHaveBeenCalledWith('https://api.sls.fi/session/validate_cms', expect.objectContaining({
            headers: { Authorization: 'Bearer access-token-2' }
        }), true);
    });

    it('does not emit or store a refreshed access token until CMS validation succeeds', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        const validationSubject = new Subject<{
            authenticated?: boolean;
        }>();
        apiService.post.mockReturnValue(of<RefreshTokenResponse>({
            msg: 'ok',
            access_token: 'access-token-2'
        }));
        apiService.get.mockReturnValue(validationSubject.asObservable());
        const service = createService();
        let result: string | undefined;

        service.refreshToken().subscribe((token) => {
            result = token;
        });

        expect(result).toBeUndefined();
        expect(localStorage.getItem('access_token')).toBe('access-token-1');

        validationSubject.next({ authenticated: true });
        validationSubject.complete();

        expect(result).toBe('access-token-2');
        expect(localStorage.getItem('access_token')).toBe('access-token-2');
    });

    it('expires the session when CMS validation fails after refresh', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        apiService.post.mockReturnValue(of<RefreshTokenResponse>({
            msg: 'ok',
            access_token: 'access-token-2'
        }));
        apiService.get.mockReturnValue(throwError(() => ({ status: 401 })));
        const service = createService();
        let receivedError: {
            status?: number;
        } | undefined;

        service.refreshToken().subscribe({
            next: () => expect.fail('expected refreshToken() to error'),
            error: (error) => {
                receivedError = error;
            }
        });

        expect(receivedError?.status).toBe(401);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(projectService.setSelectedProject).toHaveBeenCalledWith(null, { persist: false });
        expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
    });

    it('propagates refresh failures to concurrent waiters and clears auth state', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        const refreshSubject = new Subject<RefreshTokenResponse>();
        apiService.post.mockReturnValue(refreshSubject.asObservable());
        const service = createService();
        let firstError: {
            status?: number;
        } | undefined;
        let secondError: {
            status?: number;
        } | undefined;

        service.refreshToken().subscribe({
            next: () => expect.fail('expected first refresh subscriber to error'),
            error: (error) => {
                firstError = error;
            }
        });
        service.refreshToken().subscribe({
            next: () => expect.fail('expected second refresh subscriber to error'),
            error: (error) => {
                secondError = error;
            }
        });

        refreshSubject.error({ status: 401 });

        expect(firstError?.status).toBe(401);
        expect(secondError?.status).toBe(401);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(projectService.setSelectedProject).toHaveBeenCalledWith(null, { persist: false });
        expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
    });

    it('treats refresh 422 responses as terminal auth failures and clears auth state', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        apiService.post.mockReturnValue(throwError(() => ({ status: 422 })));
        const service = createService();
        let receivedError: {
            status?: number;
        } | undefined;

        service.refreshToken().subscribe({
            next: () => expect.fail('expected refreshToken() to error'),
            error: (error) => {
                receivedError = error;
            }
        });

        expect(receivedError?.status).toBe(422);
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(projectService.setSelectedProject).toHaveBeenCalledWith(null, { persist: false });
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
        redirectStorage.storeReturnUrl.mockReturnValue(false);
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
        expect(projectService.setSelectedProject).toHaveBeenCalledWith(null, { persist: true });
        expect(redirectStorage.clearReturnUrl).toHaveBeenCalledTimes(1);
    });

    it('session expiry clears auth state while preserving the chosen environment and redirect target', () => {
        localStorage.setItem('access_token', 'access-token-1');
        localStorage.setItem('refresh_token', 'refresh-token-1');
        const service = createService();

        service.expireSession();

        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(apiService.setEnvironment).not.toHaveBeenCalled();
        expect(projectService.setSelectedProject).toHaveBeenCalledWith(null, { persist: false });
        expect(redirectStorage.clearReturnUrl).not.toHaveBeenCalled();
    });
});
