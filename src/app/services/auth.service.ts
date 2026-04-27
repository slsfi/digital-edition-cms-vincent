import { HttpContext } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, map, Observable,
         of, shareReplay, switchMap, take, throwError } from 'rxjs';

import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../models/login.model';
import { SkipLoading } from '../interceptors/loading.interceptor';
import { AuthRedirectStorageService } from './auth-redirect-storage.service';
import { createLoginRedirectQueryParams, resolveRedirectFromMarker, resolveReturnUrlFromQuery } from './auth-redirect-url.utils';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';

type BackendAuthErrorCode = 'NO_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'INCORRECT_CREDENTIALS';
export type LoginErrorCode =
  'no_credentials' |
  'email_not_verified' |
  'invalid_credentials' |
  'cms_access_denied' |
  'request_failed';

interface CmsAccessValidationError extends Error {
  cmsAccessValidationFailed: true;
  status?: number;
}

/**
 * Authentication state and token lifecycle service for the CMS.
 *
 * Responsibilities:
 * - Maintain in-memory auth state from persisted CMS tokens.
 * - Perform login, CMS-user validation, refresh-token, and stale-session validation requests.
 * - Classify requests against the currently selected backend environment.
 * - Preserve safe post-login redirect intent across the login boundary.
 *
 * CMS-specific note:
 * The backend base URL is chosen by the user at login time, so auth behavior
 * must be derived from the current environment rather than from build-time
 * configuration.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly projectService = inject(ProjectService);
  private readonly redirectStorage = inject(AuthRedirectStorageService);
  private readonly router = inject(Router);
  private readonly _loginError = signal<LoginErrorCode | null>(null);
  readonly loginError = this._loginError.asReadonly();
  private readonly _loginInProgress = signal<boolean>(false);
  readonly loginInProgress = this._loginInProgress.asReadonly();
  readonly isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private initialSessionValidation$: Observable<boolean> | null = null;
  private sessionValidationInFlight$: Observable<boolean> | null = null;
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor() {
    const hasCompleteStoredSession = this.getAccessToken() !== null && this.getRefreshToken() !== null;
    if (hasCompleteStoredSession) {
      this.initialSessionValidation$ = this.createInitialSessionValidation();
    } else {
      this.clearAuthState(false, false);
    }
  }

  /**
   * Attempts login against the currently selected backend environment.
   *
   * On success, the returned access token is first used to validate that the
   * session belongs to a CMS user. Only then are tokens stored, auth state is
   * updated, and navigation continues to the safest available post-login target.
   * On failure, auth state is cleared while keeping the chosen environment
   * intact so the user can retry.
   */
  login(email: string, password: string): void {
    if (this._loginInProgress()) {
      return;
    }

    const environment = this.getConfiguredEnvironment();
    if (!environment) {
      this._loginError.set('request_failed');
      return;
    }

    this._loginError.set(null);
    this._loginInProgress.set(true);
    const normalizedEmail = email.trim();
    const url = `${environment}auth/login`;
    const body: LoginRequest = { email: normalizedEmail, password };
    this.apiService.post<LoginResponse>(url, body, {}, true).pipe(
      switchMap((response) => this.validateCmsAccessWithToken(response.access_token).pipe(
        map(() => response)
      )),
      finalize(() => {
        this._loginInProgress.set(false);
      })
    ).subscribe({
      next: (response) => {
        const { access_token, refresh_token, user_projects } = response;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        this.projectService.restoreSelectedProjectForEnvironment(
          environment,
          Array.isArray(user_projects) ? user_projects : []
        );
        this.isAuthenticated$.next(true);
        this.router.navigateByUrl(this.resolvePostLoginRedirectURL());
      },
      error: (error) => {
        this.clearAuthState(false, false);
        this._loginError.set(
          this.isCmsAccessValidationError(error)
            ? 'cms_access_denied'
            : this.resolveLoginErrorCode(error)
        );
      }
    });
  }

  /**
   * Clears the current login error state exposed to the login UI.
   */
  clearLoginError(): void {
    this._loginError.set(null);
  }

  /**
   * Returns the current in-memory authentication state synchronously.
   */
  isAuthenticated(): boolean {
    return this.isAuthenticated$.value;
  }

  /**
   * Returns true while the CMS is validating persisted startup tokens.
   */
  isInitialSessionValidationPending(): boolean {
    return this.initialSessionValidation$ !== null;
  }

  /**
   * Resolves the one-time persisted-session validation, if one is pending.
   *
   * Route guards use this before trusting stored tokens on initial app load.
   */
  validateInitialSession(): Observable<boolean> {
    return this.initialSessionValidation$ ?? of(this.isAuthenticated());
  }

  /**
   * Explicitly validates the current backend session.
   *
   * Validation requests are deduplicated while one is already in flight. Any
   * validation failure expires the CMS session because this application requires
   * strict write-session validity.
   */
  validateSession(): Observable<boolean> {
    if (this.initialSessionValidation$) {
      return this.initialSessionValidation$;
    }

    if (!this.isAuthenticated()) {
      return of(false);
    }

    const environment = this.getConfiguredEnvironment();
    if (!environment) {
      this.clearAuthState(true, true);
      return throwError(() => ({ status: 401 }));
    }

    if (this.sessionValidationInFlight$) {
      return this.sessionValidationInFlight$;
    }

    const url = `${environment}session/validate_cms`;
    const validationRequest$ = this.apiService.get<{ authenticated?: boolean }>(
      url,
      { context: new HttpContext().set(SkipLoading, true) },
      true
    ).pipe(
      map((response) => {
        if (response.authenticated === false) {
          throw this.createSessionInvalidError();
        }

        this.isAuthenticated$.next(true);
        return true;
      }),
      catchError((error) => {
        this.clearAuthState(true, false);
        return throwError(() => error);
      }),
      finalize(() => {
        this.sessionValidationInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.sessionValidationInFlight$ = validationRequest$;
    return validationRequest$;
  }

  /**
   * Requests a new access token using the stored refresh token.
   *
   * Concurrent callers share the same refresh request and wait for the same
   * emitted token. The refreshed access token must pass CMS-user validation
   * before it is stored or emitted. Missing refresh tokens fail fast and expire
   * the current session instead of issuing a backend request. Any refresh or
   * post-refresh CMS validation failure is treated as terminal in the CMS and
   * expires the current session.
   */
  refreshToken(): Observable<string> {
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1)
      );
    }

    const environment = this.getConfiguredEnvironment();
    const refreshToken = this.getRefreshToken();
    if (!environment || !refreshToken) {
      this.expireSession();
      return throwError(() => new Error('Refresh token is missing.'));
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);
    let refreshCompleted = false;
    const url = `${environment}auth/refresh`;
    const headers = { Authorization: `Bearer ${refreshToken}` };
    return this.apiService.post<RefreshTokenResponse>(url, null, { headers }, true).pipe(
      switchMap((response) => this.validateCmsAccessWithToken(response.access_token).pipe(
        map(() => response.access_token)
      )),
      map((accessToken) => {
        refreshCompleted = true;
        localStorage.setItem('access_token', accessToken);
        this.refreshTokenSubject.next(accessToken);
        this.isAuthenticated$.next(true);
        return accessToken;
      }),
      catchError((error) => {
        refreshCompleted = true;
        this.refreshTokenSubject.error(error);
        this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
        this.expireSession();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshTokenInProgress = false;
        if (!refreshCompleted) {
          this.refreshTokenSubject.error(
            new Error('Refresh token request was canceled before completion.')
          );
          this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
        }
      })
    );
  }

  /**
   * Clears the authenticated CMS session, including tokens, selected project,
   * chosen environment, and stored redirect target.
   *
   * Use this for explicit user-initiated logout, not for forced session expiry.
   */
  logout(): void {
    this.clearAuthState(true, true);
  }

  /**
   * Clears the authenticated CMS session after a terminal auth failure while
   * preserving the selected backend environment and any freshly stored
   * re-authentication redirect target. The persisted environment/project pair
   * is also preserved so login can restore it before returning to the target
   * route.
   */
  expireSession(): void {
    this.clearAuthState(false, false);
  }

  /**
   * Stores the current CMS route for one-time post-login restoration after a
   * forced re-authentication flow.
   *
   * Returns the query params to use for `/login`, using one-time marker storage
   * when possible and falling back to the legacy `returnUrl` query parameter.
   */
  preserveReturnUrlForReauthentication(currentUrl: string): Record<string, unknown> | undefined {
    return createLoginRedirectQueryParams(this.router, this.redirectStorage, currentUrl);
  }

  /**
   * Returns the stored access token, if any.
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Returns the stored refresh token, if any.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Returns true when the URL targets the currently selected backend base URL.
   */
  isRequestToConfiguredBackend(url: string): boolean {
    const environment = this.getConfiguredEnvironment();
    return !!environment && url.startsWith(environment);
  }

  /**
   * Returns true when the URL targets an auth endpoint under the currently
   * selected backend.
   */
  isRequestToAuthEndpoint(url: string): boolean {
    const environment = this.getConfiguredEnvironment();
    if (!environment) {
      return false;
    }

    const authEndpointPrefix = `${environment}auth`;
    if (!url.startsWith(authEndpointPrefix)) {
      return false;
    }

    const boundary = url.charAt(authEndpointPrefix.length);
    return boundary === '' || boundary === '/' || boundary === '?' || boundary === '#';
  }

  /**
   * Returns the currently selected backend environment normalized with a
   * trailing slash, or null when no environment is configured.
   */
  private getConfiguredEnvironment(): string | null {
    const environment = this.apiService.environment?.trim();
    if (!environment) {
      return null;
    }

    return environment.endsWith('/') ? environment : `${environment}/`;
  }

  /**
   * Validates that an access token belongs to a CMS-user session.
   *
   * The request uses the access token as a caller-supplied Authorization
   * header. That keeps a CMS-access denial from entering the interceptor
   * refresh flow while the token itself is being validated.
   */
  private validateCmsAccessWithToken(accessToken: string): Observable<boolean> {
    const environment = this.getConfiguredEnvironment();
    if (!environment) {
      return throwError(() => this.createCmsAccessValidationError());
    }

    const url = `${environment}session/validate_cms`;
    return this.apiService.get<{ authenticated?: boolean }>(
      url,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        context: new HttpContext().set(SkipLoading, true)
      },
      true
    ).pipe(
      map((response) => {
        if (response.authenticated === false) {
          throw this.createCmsAccessValidationError();
        }

        return true;
      }),
      catchError((error) => throwError(() => this.createCmsAccessValidationError(error)))
    );
  }

  /**
   * Validates a complete token pair found at app startup before trusting it.
   *
   * A stale access token gets one refresh attempt. The refresh flow validates
   * the refreshed token before the session is accepted.
   */
  private createInitialSessionValidation(): Observable<boolean> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.clearAuthState(true, false);
      return of(false);
    }

    return this.validateCmsAccessWithToken(accessToken).pipe(
      map(() => this.acceptInitialSession()),
      catchError((error) => {
        if (!this.shouldRetryCmsValidationWithRefresh(error)) {
          this.clearAuthState(true, false);
          return of(false);
        }

        return this.refreshToken().pipe(
          map(() => this.acceptInitialSession()),
          catchError(() => {
            this.clearAuthState(true, false);
            return of(false);
          })
        );
      }),
      finalize(() => {
        this.initialSessionValidation$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  /**
   * Marks a startup token pair as trusted after CMS-user validation succeeds.
   */
  private acceptInitialSession(): boolean {
    this.isAuthenticated$.next(true);
    return true;
  }

  /**
   * Returns true for validation failures where refreshing the access token may
   * recover a persisted startup session.
   */
  private shouldRetryCmsValidationWithRefresh(error: unknown): boolean {
    const status = (error as { status?: unknown } | null)?.status;
    return status === 401 || status === 422;
  }

  /**
   * Resolves the route to visit after a successful login.
   *
   * Marker-based redirect storage has priority over the legacy `returnUrl`
   * query parameter. The default fallback is the CMS home route.
   */
  private resolvePostLoginRedirectURL(): string {
    const currentRouteURL = this.router.url;
    const returnURLFromMarker = resolveRedirectFromMarker(this.router, this.redirectStorage, currentRouteURL);
    if (returnURLFromMarker) {
      return this.resolveProjectAwarePostLoginRedirectURL(returnURLFromMarker);
    }

    const returnURLFromQuery = resolveReturnUrlFromQuery(this.router, currentRouteURL);
    if (returnURLFromQuery) {
      return this.resolveProjectAwarePostLoginRedirectURL(returnURLFromQuery);
    }

    return '/';
  }

  /**
   * Project-scoped routes cannot be resumed unless login restored a project.
   * In that case, send the user through the landing page to choose one.
   */
  private resolveProjectAwarePostLoginRedirectURL(returnURL: string): string {
    if (this.projectService.getCurrentProject() || this.isRouteAvailableWithoutSelectedProject(returnURL)) {
      return returnURL;
    }

    return '/';
  }

  /**
   * Routes that can be used before a project has been selected.
   */
  private isRouteAvailableWithoutSelectedProject(url: string): boolean {
    try {
      const primaryRoute = this.router.parseUrl(url).root.children['primary'];
      const path = primaryRoute?.segments.map((segment) => segment.path).join('/') ?? '';
      return path === '' || path === 'projects';
    } catch {
      return false;
    }
  }

  /**
   * Maps backend/login transport errors into UI-facing login error codes.
   */
  private resolveLoginErrorCode(error: unknown): LoginErrorCode {
    const backendErrorCode = this.getBackendAuthErrorCode(error);
    if (backendErrorCode === 'NO_CREDENTIALS') {
      return 'no_credentials';
    }

    if (backendErrorCode === 'EMAIL_NOT_VERIFIED') {
      return 'email_not_verified';
    }

    if (backendErrorCode === 'INCORRECT_CREDENTIALS') {
      return 'invalid_credentials';
    }

    if ((error as { status?: unknown } | null)?.status === 401) {
      return 'invalid_credentials';
    }

    return 'request_failed';
  }

  /**
   * Extracts a recognized backend auth error code from a backend error payload.
   */
  private getBackendAuthErrorCode(error: unknown): BackendAuthErrorCode | null {
    const err = (error as { error?: { err?: unknown } } | null)?.error?.err;
    return this.isBackendAuthErrorCode(err) ? err : null;
  }

  /**
   * Type guard for backend auth error codes used by the login flow.
   */
  private isBackendAuthErrorCode(value: unknown): value is BackendAuthErrorCode {
    return (
      value === 'NO_CREDENTIALS' ||
      value === 'EMAIL_NOT_VERIFIED' ||
      value === 'INCORRECT_CREDENTIALS'
    );
  }

  /**
   * Creates an auth-shaped error for successful validation responses that deny
   * authentication.
   */
  private createSessionInvalidError(): Error & { status: number } {
    const error = new Error('Session is not authenticated.') as Error & { status: number };
    error.status = 401;
    return error;
  }

  /**
   * Creates an error marker for failed CMS-user validation.
   */
  private createCmsAccessValidationError(error?: unknown): CmsAccessValidationError {
    const cmsAccessError = new Error('CMS access could not be validated.') as CmsAccessValidationError;
    cmsAccessError.cmsAccessValidationFailed = true;

    const status = (error as { status?: unknown } | null)?.status;
    if (typeof status === 'number') {
      cmsAccessError.status = status;
    }

    return cmsAccessError;
  }

  /**
   * Returns true when the error came from CMS-user validation.
   */
  private isCmsAccessValidationError(error: unknown): error is CmsAccessValidationError {
    return (error as { cmsAccessValidationFailed?: unknown } | null)?.cmsAccessValidationFailed === true;
  }

  /**
   * Clears stored auth state and resets related in-memory state.
   *
   * `clearRedirectTarget` controls whether one-time post-login redirect state is
   * removed. `clearEnvironment` controls whether the chosen backend environment
   * is also forgotten.
   */
  private clearAuthState(clearRedirectTarget: boolean, clearEnvironment: boolean): void {
    this.initialSessionValidation$ = null;
    this.sessionValidationInFlight$ = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.projectService.setSelectedProject(null, { persist: clearEnvironment });
    if (clearEnvironment) {
      this.apiService.setEnvironment(null);
    }
    this.isAuthenticated$.next(false);
    if (clearRedirectTarget) {
      this.redirectStorage.clearReturnUrl();
    }
  }
}
