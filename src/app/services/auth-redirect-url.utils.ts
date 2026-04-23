import { Router } from '@angular/router';

import {
  AUTH_REDIRECT_MARKER_QUERY_PARAM,
  AUTH_REDIRECT_MARKER_VALUE,
  AuthRedirectStorageService
} from './auth-redirect-storage.service';

const MAX_RETURN_URL_LENGTH = 2000;
const LOGIN_ROUTE_PREFIX = '/login';

type QueryParams = Record<string, unknown>;

/**
 * Returns true when the URL points to the login route or one of its query/path
 * variants.
 */
export function isLoginRouteURL(url: string): boolean {
  return (
    url === LOGIN_ROUTE_PREFIX ||
    url.startsWith(`${LOGIN_ROUTE_PREFIX}?`) ||
    url.startsWith(`${LOGIN_ROUTE_PREFIX}/`)
  );
}

/**
 * Returns the value only when it is a safe internal redirect target.
 *
 * External URLs, protocol-relative URLs, login-loop targets, overlong values,
 * and values Angular cannot parse are rejected.
 */
export function getSafeInternalRedirectURL(router: Router, value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  if (isLoginRouteURL(value)) {
    return null;
  }

  if (value.length > MAX_RETURN_URL_LENGTH) {
    return null;
  }

  try {
    router.parseUrl(value);
  } catch {
    return null;
  }

  return value;
}

/**
 * Resolves a redirect target from the one-time marker-based redirect flow.
 *
 * When the marker is present, the stored URL is consumed from redirect storage
 * and returned only if it remains a safe internal target.
 */
export function resolveRedirectFromMarker(
  router: Router,
  authRedirectStorage: Pick<AuthRedirectStorageService, 'consumeReturnUrl'>,
  currentUrl: string
): string | null {
  const queryParams = getQueryParams(router, currentUrl);
  if (!queryParams) {
    return null;
  }

  const markerValue = queryParams[AUTH_REDIRECT_MARKER_QUERY_PARAM];
  if (markerValue !== AUTH_REDIRECT_MARKER_VALUE) {
    return null;
  }

  const storedReturnURL = authRedirectStorage.consumeReturnUrl();
  return getSafeInternalRedirectURL(router, storedReturnURL);
}

/**
 * Resolves a redirect target from the legacy `returnUrl` query parameter.
 */
export function resolveReturnUrlFromQuery(router: Router, currentUrl: string): string | null {
  const queryParams = getQueryParams(router, currentUrl);
  if (!queryParams) {
    return null;
  }

  return getSafeInternalRedirectURL(router, queryParams['returnUrl']);
}

/**
 * Resolves where an already-authenticated user should be sent when they visit
 * the login route.
 *
 * Marker-based redirect storage takes precedence over the legacy `returnUrl`
 * query parameter.
 */
export function resolveLoginRouteRedirectURL(
  router: Router,
  authRedirectStorage: Pick<AuthRedirectStorageService, 'consumeReturnUrl'>,
  currentUrl: string
): string | null {
  const redirectFromMarker = resolveRedirectFromMarker(router, authRedirectStorage, currentUrl);
  if (redirectFromMarker) {
    return redirectFromMarker;
  }

  return resolveReturnUrlFromQuery(router, currentUrl);
}

/**
 * Parses query parameters from the provided URL with Angular router parsing.
 *
 * Returns null when the current URL itself is malformed.
 */
function getQueryParams(router: Router, currentUrl: string): QueryParams | null {
  try {
    return (router.parseUrl(currentUrl).queryParams ?? {}) as QueryParams;
  } catch {
    return null;
  }
}
