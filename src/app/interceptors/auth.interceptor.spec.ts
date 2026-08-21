import type { MockedObject } from "vitest";
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { AUTH_REDIRECT_MARKER_QUERY_PARAM, AUTH_REDIRECT_MARKER_VALUE } from '../services/auth-redirect-storage.service';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let authService: MockedObject<Pick<AuthService, 'getAccessToken' | 'getRefreshToken' | 'refreshToken' | 'expireSession' | 'preserveReturnUrlForReauthentication' | 'isRequestToConfiguredBackend' | 'isRequestToAuthEndpoint'>>;
    let router: MockedObject<Pick<Router, 'navigate'>>;
    const backendBaseURL = 'https://api.sls.fi/';
    const backendProtectedURL = `${backendBaseURL}digitaledition/projects/list/`;
    const backendAuthLoginURL = `${backendBaseURL}auth/login`;
    const nonBackendURL = 'https://example.com/non-backend';

    beforeEach(() => {
        authService = {
            getAccessToken: vi.fn().mockName("AuthService.getAccessToken"),
            getRefreshToken: vi.fn().mockName("AuthService.getRefreshToken"),
            refreshToken: vi.fn().mockName("AuthService.refreshToken"),
            expireSession: vi.fn().mockName("AuthService.expireSession"),
            preserveReturnUrlForReauthentication: vi.fn().mockName("AuthService.preserveReturnUrlForReauthentication"),
            isRequestToConfiguredBackend: vi.fn().mockName("AuthService.isRequestToConfiguredBackend"),
            isRequestToAuthEndpoint: vi.fn().mockName("AuthService.isRequestToAuthEndpoint")
        };
        router = {
            navigate: vi.fn().mockName("Router.navigate")
        };
        router.navigate.mockResolvedValue(true);
        Object.defineProperty(router, 'url', { value: '/projects/42?tab=images', writable: true });
        authService.getRefreshToken.mockReturnValue('refresh-token');
        authService.preserveReturnUrlForReauthentication.mockReturnValue({
            [AUTH_REDIRECT_MARKER_QUERY_PARAM]: AUTH_REDIRECT_MARKER_VALUE
        });
        authService.isRequestToConfiguredBackend.mockImplementation((url: string) => url.startsWith(backendBaseURL));
        authService.isRequestToAuthEndpoint.mockImplementation((url: string) => url.startsWith(`${backendBaseURL}auth/`));

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: router }
            ]
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('adds the bearer token for backend requests when no Authorization header exists', () => {
        authService.getAccessToken.mockReturnValue('abc-token');

        http.get(backendProtectedURL).subscribe();

        const req = httpMock.expectOne(backendProtectedURL);
        expect(req.request.headers.get('Authorization')).toBe('Bearer abc-token');
        req.flush({ ok: true });
    });

    it('does not add a bearer token to auth endpoint requests', () => {
        authService.getAccessToken.mockReturnValue('abc-token');

        http.post(backendAuthLoginURL, {}).subscribe();

        const req = httpMock.expectOne(backendAuthLoginURL);
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({ ok: true });
    });

    it('preserves an existing Authorization header on protected backend requests', () => {
        authService.getAccessToken.mockReturnValue('abc-token');

        http.get(backendProtectedURL, {
            headers: new HttpHeaders({ Authorization: 'Bearer existing-token' })
        }).subscribe();

        const req = httpMock.expectOne(backendProtectedURL);
        expect(req.request.headers.get('Authorization')).toBe('Bearer existing-token');
        req.flush({ ok: true });
    });

    it('does not enter the CMS refresh flow for requests with a caller-supplied Authorization header', () => {
        authService.getAccessToken.mockReturnValue('abc-token');
        let receivedError: {
            status?: number;
        } | undefined;

        http.get(backendProtectedURL, {
            headers: new HttpHeaders({ Authorization: 'Bearer existing-token' })
        }).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const req = httpMock.expectOne(backendProtectedURL);
        expect(req.request.headers.get('Authorization')).toBe('Bearer existing-token');
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.refreshToken).not.toHaveBeenCalled();
        expect(authService.expireSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(receivedError?.status).toBe(401);
    });

    it('does not add a bearer token to non-backend requests', () => {
        authService.getAccessToken.mockReturnValue('abc-token');

        http.get(nonBackendURL).subscribe();

        const req = httpMock.expectOne(nonBackendURL);
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({ ok: true });
    });

    it('refreshes the token and retries backend requests after a 401', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        authService.refreshToken.mockReturnValue(of('new-token'));

        http.get(backendProtectedURL).subscribe();

        const firstReq = httpMock.expectOne(backendProtectedURL);
        expect(firstReq.request.headers.get('Authorization')).toBe('Bearer expired-token');
        firstReq.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        const retryReq = httpMock.expectOne(backendProtectedURL);
        expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
        retryReq.flush({ ok: true });

        expect(authService.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('does not try to refresh auth endpoint 401 responses', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        let receivedError: {
            status?: number;
        } | undefined;

        http.post(backendAuthLoginURL, { email: 'u', password: 'p' }).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const loginReq = httpMock.expectOne(backendAuthLoginURL);
        loginReq.flush({ message: 'invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.refreshToken).not.toHaveBeenCalled();
        expect(authService.expireSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(receivedError?.status).toBe(401);
    });

    it('logs out and redirects to /login when refresh returns 401', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        authService.refreshToken.mockReturnValue(throwError(() => ({ status: 401 })));
        let receivedError: {
            status?: number;
        } | undefined;

        http.get(backendProtectedURL).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const firstReq = httpMock.expectOne(backendProtectedURL);
        firstReq.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.expireSession).toHaveBeenCalledTimes(1);
        expect(authService.preserveReturnUrlForReauthentication).toHaveBeenCalledWith('/projects/42?tab=images');
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            replaceUrl: true,
            queryParams: {
                [AUTH_REDIRECT_MARKER_QUERY_PARAM]: AUTH_REDIRECT_MARKER_VALUE
            }
        });
        expect(receivedError?.status).toBe(401);
    });

    it('logs out and redirects to /login when refresh returns 422', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        authService.refreshToken.mockReturnValue(throwError(() => ({ status: 422 })));
        let receivedError: {
            status?: number;
        } | undefined;

        http.get(backendProtectedURL).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const firstReq = httpMock.expectOne(backendProtectedURL);
        firstReq.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.expireSession).toHaveBeenCalledTimes(1);
        expect(authService.preserveReturnUrlForReauthentication).toHaveBeenCalledWith('/projects/42?tab=images');
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            replaceUrl: true,
            queryParams: {
                [AUTH_REDIRECT_MARKER_QUERY_PARAM]: AUTH_REDIRECT_MARKER_VALUE
            }
        });
        expect(receivedError?.status).toBe(422);
    });

    it('redirects to /login when refresh fails with a non-401 error', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        authService.refreshToken.mockReturnValue(throwError(() => ({ status: 500 })));
        let receivedError: {
            status?: number;
        } | undefined;

        http.get(backendProtectedURL).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const firstReq = httpMock.expectOne(backendProtectedURL);
        firstReq.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.expireSession).toHaveBeenCalledTimes(1);
        expect(authService.preserveReturnUrlForReauthentication).toHaveBeenCalledWith('/projects/42?tab=images');
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            replaceUrl: true,
            queryParams: {
                [AUTH_REDIRECT_MARKER_QUERY_PARAM]: AUTH_REDIRECT_MARKER_VALUE
            }
        });
        expect(receivedError?.status).toBe(500);
    });

    it('logs out and redirects when the backend returns 401 and no refresh token is available', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        authService.getRefreshToken.mockReturnValue(null);
        let receivedError: {
            status?: number;
        } | undefined;

        http.get(backendProtectedURL).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const req = httpMock.expectOne(backendProtectedURL);
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.refreshToken).not.toHaveBeenCalled();
        expect(authService.expireSession).toHaveBeenCalledTimes(1);
        expect(authService.preserveReturnUrlForReauthentication).toHaveBeenCalledWith('/projects/42?tab=images');
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            replaceUrl: true,
            queryParams: {
                [AUTH_REDIRECT_MARKER_QUERY_PARAM]: AUTH_REDIRECT_MARKER_VALUE
            }
        });
        expect(receivedError?.status).toBe(401);
    });

    it('does not try to refresh non-backend 401 responses', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        let receivedError: {
            status?: number;
        } | undefined;

        http.get(nonBackendURL).subscribe({
            error: (error) => {
                receivedError = error;
            }
        });

        const req = httpMock.expectOne(nonBackendURL);
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(authService.refreshToken).not.toHaveBeenCalled();
        expect(authService.expireSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(receivedError?.status).toBe(401);
    });

    it('falls back to returnUrl query params when session-expiry redirect storage is unavailable', () => {
        authService.getAccessToken.mockReturnValue('expired-token');
        authService.getRefreshToken.mockReturnValue(null);
        authService.preserveReturnUrlForReauthentication.mockReturnValue({ returnUrl: '/projects/42?tab=images' });

        http.get(backendProtectedURL).subscribe({
            error: () => undefined
        });

        const req = httpMock.expectOne(backendProtectedURL);
        req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            replaceUrl: true,
            queryParams: { returnUrl: '/projects/42?tab=images' }
        });
    });
});
