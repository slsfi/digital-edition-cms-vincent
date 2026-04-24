# Auth flow

This document describes the expected authentication behavior of the CMS in human-readable terms. It is meant to be a behavioral contract for reviewers and maintainers, not a line-by-line copy of the implementation.

Any change to login, logout, refresh, session validation, redirect handling, token storage, selected environment, selected project restoration, or protected route behavior should update this document and the related specs.

## Main rules

- The CMS only treats the user as authenticated when both an access token and a refresh token are present.
- A backend-authenticated user is not enough for this app. The session must also validate as a CMS-user session.
- Tokens are stored in `localStorage` as `access_token` and `refresh_token`.
- The selected backend environment is stored separately by `ApiService`.
- The selected project is stored with the backend environment it belongs to, so a project from one environment is not restored in another.
- Redirect targets are accepted only when they are safe internal CMS URLs.
- External URLs, protocol-relative URLs, login-loop URLs, overlong URLs, and malformed URLs are rejected as redirect targets.
- A marker-based redirect stored in `sessionStorage` takes precedence over the legacy `returnUrl` query parameter.
- Marker-based redirect targets are consumed once.
- Explicit logout clears more state than forced session expiry.

## Main participants

- `AuthService` owns authentication state, token storage, login, refresh, session expiry, logout, and post-login redirect resolution.
- `authGuard` decides whether a route can activate and handles redirects into or away from `/login`.
- `authInterceptor` attaches access tokens to CMS backend requests and handles backend `401` responses through refresh or forced re-authentication.
- `AuthRedirectStorageService` stores one-time post-login redirect targets in `sessionStorage`.
- `auth-redirect-url.utils.ts` validates and resolves safe redirect URLs.
- `LoginComponent` validates the login form and selected environment before asking `AuthService` to log in.
- `ProjectService` restores the last selected project only when it still belongs to the current backend environment and is present in the login response.

## Redirect safety

Redirect targets must be internal CMS routes. A redirect target is accepted only when it:

- is a string;
- starts with `/`;
- does not start with `//`;
- does not point back to `/login`;
- is no longer than 2000 characters;
- can be parsed by the Angular router.

When a safe target can be stored in `sessionStorage`, the login URL receives a small marker query parameter: `/login?rt=1`. The actual return target is kept out of the visible URL and is consumed once after login.

When `sessionStorage` is unavailable or rejects writes, the CMS falls back to the legacy query parameter form: `/login?returnUrl=...`.

If the target is unsafe, no return target is preserved and login falls back to the CMS home route.

## App start

When `AuthService` is created, it checks persisted tokens.

If both access and refresh tokens exist, the CMS creates a one-time startup validation for `/session/validate_cms`. The user is not treated as authenticated until that validation succeeds.

If the stored access token is stale, startup validation may refresh the access token once. The refreshed access token must also pass `/session/validate_cms` before the session is accepted.

While startup validation is pending, the route guard waits for it before deciding whether to allow a protected route or redirect to `/login`. This is a bootstrap check, not route-guard polling on every navigation.

If startup validation succeeds, the in-memory authentication state is set to authenticated and protected routes can activate.

If startup validation fails, auth state is cleared. The selected backend environment is preserved so the login page can reopen with the same environment selected.

If either token is missing, auth state is cleared. This removes any partial token state and marks the user unauthenticated.

## Unauthenticated user opens a protected route

All application routes are guarded, including `/login`.

When an unauthenticated user opens a protected route:

1. The guard checks whether the requested route is a safe internal return target.
2. Any previously stored return target is cleared.
3. If possible, the requested route is stored in `sessionStorage` and the user is redirected to `/login?rt=1`.
4. If redirect storage is unavailable, the user is redirected to `/login` with a `returnUrl` query parameter.
5. If the requested route is not a safe redirect target, the user is redirected to `/login` without a return target.

The login route itself is allowed for unauthenticated users.

## Authenticated user opens `/login`

When an authenticated user opens `/login`, the guard redirects them away from the login page.

The redirect target is resolved in this order:

1. If the URL contains the marker query parameter and a safe stored target exists, consume that stored target and redirect there.
2. Otherwise, if the URL contains a safe `returnUrl`, redirect there.
3. Otherwise, redirect to `/`.

Unsafe redirect targets are ignored, so an authenticated visit to an unsafe login redirect falls back to `/`.

## Login form and environment selection

The login form requires an email address, password, and backend environment.

The user can choose a predefined environment or provide a custom environment. Custom environments must be valid `https` URLs and cannot contain username or password credentials. Query strings and hash fragments are stripped, and the URL is normalized with a trailing slash.

Before login starts, the selected environment is stored through `ApiService`. The email address is trimmed before it is sent.

If the form changes after a login error, the visible login error is cleared.

## Successful login

On successful login:

1. The backend returns a new access token, refresh token, and the user's project list.
2. Before the CMS accepts the login, it calls `/session/validate_cms` with the returned access token.
3. If CMS-user validation succeeds, the access and refresh tokens are stored in `localStorage`.
4. `ProjectService` tries to restore the previously selected project for the current environment, but only if that project appears in the login response.
5. The in-memory auth state is set to authenticated.
6. The user is redirected to the safest available post-login route.

The post-login CMS-user validation request uses the just-returned access token directly. A failed validation is not treated as a refreshable API `401`, because the frontend has not accepted the login yet.

Any non-200 response from `/session/validate_cms` during this post-login check fails the login attempt. This includes `401`, `422`, server errors, and network failures. The CMS denies access by default when it cannot verify CMS-user access.

Post-login redirect resolution uses this order:

1. Marker-based stored redirect target.
2. Legacy `returnUrl` query parameter.
3. `/`.

Project-aware redirect handling applies after the return target is found. The home route `/` and project selection route `/projects` can be resumed without an active project. Other routes require a project to have been restored during login. If no project is restored, the user is sent to `/` instead of the original project-dependent route.

## Failed login

On failed login:

- any stale access and refresh tokens are removed;
- the in-memory selected project is cleared;
- the chosen environment is preserved so the user can retry without selecting it again;
- the stored redirect target is preserved so a later successful retry can still return to the original page;
- auth state is set to unauthenticated;
- a user-facing login error code is set.

Backend auth error codes are mapped as follows:

- `NO_CREDENTIALS` becomes `no_credentials`;
- `EMAIL_NOT_VERIFIED` becomes `email_not_verified`;
- `INCORRECT_CREDENTIALS` becomes `invalid_credentials`;
- a `401` without a recognized backend auth code also becomes `invalid_credentials`;
- all other login failures become `request_failed`.

Duplicate login submissions are ignored while a login request is already in progress.

## Failed post-login CMS-user validation

If `/auth/login` succeeds but `/session/validate_cms` fails immediately afterwards, the login attempt is rejected.

In that case:

- no authenticated CMS session is accepted by the frontend;
- access and refresh tokens are cleared;
- the in-memory selected project is cleared;
- the chosen environment is preserved so the user can retry without selecting it again;
- the stored redirect target is preserved so a later successful retry can still return to the original page;
- auth state is set to unauthenticated;
- the login page shows a CMS-access validation error.

This prevents a non-CMS backend user from reaching the CMS home page in a half-valid state where route guards allow access but CMS-only API calls fail.

## Authenticated user opens a protected route

When the in-memory auth state is authenticated, the guard allows protected routes.

The guard does not itself validate the server-side session before allowing the route. Active session validity is enforced when the app makes backend requests. If the backend rejects a request with `401`, the interceptor handles refresh or forced re-authentication.

## Backend request authorization

For each HTTP request, the auth interceptor decides whether the CMS access token should be attached.

The access token is attached only when:

- an access token exists;
- the request targets the currently selected backend environment;
- the request is not an `/auth` endpoint;
- the caller did not already provide an `Authorization` header.

The interceptor does not attach CMS tokens to non-backend requests. It also does not overwrite caller-supplied `Authorization` headers.

Requests to backend auth endpoints, such as login and refresh, are not given the stored access token by the interceptor.

## Backend `401` for a protected request

When a configured-backend, non-auth request fails with `401`, the interceptor enters the refresh flow only if it attached the CMS access token to the original request.

If a refresh token exists:

1. `AuthService` sends the refresh token to the backend refresh endpoint as a bearer token.
2. If refresh succeeds, the new access token replaces the old access token in `localStorage`.
3. The original request is retried with the new access token.
4. The retried response is returned to the original caller.

Concurrent refresh callers share one refresh request. They all receive the same new access token if refresh succeeds, or the same error if refresh fails.

If no refresh token exists, the CMS does not call the refresh endpoint. The session is expired and the user is sent to `/login`.

## Refresh failure

Any refresh endpoint failure is treated as a terminal auth failure for the CMS. This includes `401`, `422`, and non-auth-looking failures such as `500`.

On refresh failure:

- auth state is set to unauthenticated;
- access and refresh tokens are removed;
- the active selected project is cleared in memory;
- the selected backend environment is preserved;
- the persisted environment/project pair is preserved for possible restoration after the next successful login;
- the current safe route is preserved as a one-time post-login return target;
- the user is redirected to `/login` with `replaceUrl: true`;
- the original caller receives the refresh error.

In the current interceptor chain, an error from the refresh-and-retry sequence is handled as forced re-authentication. That means an error emitted by the retried request after refresh also uses this terminal path.

## Backend `401` cases that do not refresh

The CMS does not enter the refresh flow when:

- the `401` came from an auth endpoint, such as login;
- the `401` came from a non-backend request;
- the request had a caller-supplied `Authorization` header;
- the interceptor did not attach the CMS access token to the request.

In these cases, the error is passed back to the caller. The interceptor does not expire the CMS session or redirect to `/login`.

## Forced re-authentication

Forced re-authentication happens after terminal auth failure, such as refresh failure or a protected backend `401` without a refresh token.

Before redirecting to `/login`, the CMS tries to preserve the current route as a safe one-time return target. It then expires the session.

Forced session expiry clears:

- access token;
- refresh token;
- in-memory auth state;
- active selected project in memory.

Forced session expiry preserves:

- selected backend environment;
- stored environment/project pair;
- the freshly stored return target.

This lets the login page reopen with the same environment selected. If login succeeds and the stored project is still valid for the user, the CMS can return to the interrupted route.

## Explicit logout

Explicit logout is different from forced session expiry.

Explicit logout clears:

- access token;
- refresh token;
- in-memory auth state;
- selected backend environment;
- active selected project;
- persisted selected project;
- stored post-login redirect target.

Use explicit logout for user-initiated logout. Do not use it for token expiry or forced re-authentication, because it intentionally forgets the environment and redirect context.

## Session validation

`AuthService.validateSession()` is available for explicit CMS-user session validation. It calls `/session/validate_cms`, not `/session/validate`, because this app needs to verify CMS-user access and not only general backend authentication. It is not called by the route guard.

When the user is not authenticated in memory, validation returns `false` without calling the backend.

When no backend environment is configured, validation clears auth state, environment, and redirect target, then fails with a `401`-shaped error.

When validation is already in flight, concurrent callers share the same backend request.

When the backend says the session is authenticated, validation returns `true` and keeps auth state authenticated.

When the backend says `authenticated: false`, validation treats that as a session-invalid `401`.

On any validation failure:

- auth state is set to unauthenticated;
- access and refresh tokens are removed;
- the active selected project is cleared in memory;
- the selected backend environment is preserved, unless no environment was configured in the first place;
- the stored post-login redirect target is cleared.

## State-Clearing Summary

| Situation | Tokens | Auth state | Environment | Project | Redirect target |
| --- | --- | --- | --- | --- | --- |
| Failed startup CMS-user validation | Cleared | Unauthenticated | Preserved | Active project cleared, persisted project preserved | Cleared before any new route redirect is stored |
| Failed login | Cleared | Unauthenticated | Preserved | Active project cleared, persisted project preserved | Preserved |
| Failed post-login CMS-user validation | Cleared | Unauthenticated | Preserved | Active project cleared, persisted project preserved | Preserved |
| Refresh failure | Cleared | Unauthenticated | Preserved | Active project cleared, persisted project preserved | Preserved for re-authentication |
| Protected backend `401` without refresh token | Cleared | Unauthenticated | Preserved | Active project cleared, persisted project preserved | Preserved for re-authentication |
| Explicit logout | Cleared | Unauthenticated | Cleared | Active and persisted project cleared | Cleared |
| Session validation failure | Cleared | Unauthenticated | Usually preserved | Active project cleared, persisted project preserved | Cleared |
| Missing environment during validation | Cleared | Unauthenticated | Cleared | Active and persisted project cleared | Cleared |

## Useful Review Questions

Use these questions when changing auth behavior:

- What happens when an unauthenticated user opens a protected route?
- What happens when the app starts with persisted access and refresh tokens?
- What happens when an authenticated user opens `/login`?
- What happens after successful login with a marker redirect?
- What happens after successful login with only `returnUrl`?
- What happens when `/auth/login` succeeds but `/session/validate_cms` fails?
- What happens after successful login when the return route needs a project but no project was restored?
- What happens when login fails?
- What happens when the backend returns `401` for a protected API request?
- What happens when refresh succeeds?
- What happens when refresh fails with `401`, `422`, or another error?
- What happens when the access token exists but the refresh token is missing?
- What happens when a request already has an `Authorization` header?
- What happens when the request is not for the configured backend?
- What happens on explicit logout?
- What happens during forced re-authentication?
- Which state should survive so the user can retry without losing context?
- Which state must be cleared so stale credentials or stale redirects cannot leak into the next session?

## Code and Test References

Core behavior:

- `src/app/services/auth.service.ts`
- `src/app/interceptors/auth.interceptor.ts`
- `src/app/guards/auth.guard.ts`
- `src/app/services/auth-redirect-storage.service.ts`
- `src/app/services/auth-redirect-url.utils.ts`
- `src/app/pages/login/login.component.ts`
- `src/app/services/project.service.ts`

Primary specs:

- `src/app/services/auth.service.spec.ts`
- `src/app/interceptors/auth.interceptor.spec.ts`
- `src/app/guards/auth.guard.spec.ts`
- `src/app/pages/login/login.component.spec.ts`
- `src/app/services/project.service.spec.ts`
