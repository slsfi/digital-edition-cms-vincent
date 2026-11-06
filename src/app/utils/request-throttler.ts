import { HttpErrorResponse } from '@angular/common/http';
import { defer, Observable, of, switchMap, take, tap, timer } from 'rxjs';

export type RequestRunner = <T>(request: () => Observable<T>) => Observable<T>;

/** Creates pacing state for one bulk operation whose requests are subscribed sequentially. */
export function createThrottledRequestRunner(): RequestRunner {
  const requestDelayMs = 150;
  const batchSize = 10;
  const batchDelayMs = 1000;
  const failureDelayMs = 5000;
  let requestIndex = 0;
  let nextFailureDelayMs = 0;

  return <T>(request: () => Observable<T>) => defer(() => {
    const index = requestIndex++;
    // Start immediately, then use the longest applicable pause between attempts.
    const delayMs = Math.max(
      index % batchSize === 0 ? batchDelayMs : requestDelayMs,
      nextFailureDelayMs
    );
    const wait$ = index === 0 ? of(0) : timer(delayMs);
    return wait$.pipe(
      switchMap(request),
      take(1),
      tap({
        next: () => { nextFailureDelayMs = 0; },
        error: (error: unknown) => { nextFailureDelayMs = getRequestFailureDelay(error, failureDelayMs); }
      })
    );
  });
}

function getRequestFailureDelay(error: unknown, defaultDelayMs: number): number {
  // These statuses can indicate temporary backend or connectivity problems.
  if (!(error instanceof HttpErrorResponse) || ![0, 408, 429, 500, 502, 503, 504].includes(error.status)) {
    return 0;
  }

  const retryAfter = error.headers.get('Retry-After')?.trim();
  if (!retryAfter) {
    return defaultDelayMs;
  }

  // Retry-After can contain either a number of seconds or an HTTP date.
  const retryAfterMs = /^\d+$/.test(retryAfter)
    ? Number(retryAfter) * 1000
    : Date.parse(retryAfter) - Date.now();
  return Number.isFinite(retryAfterMs) ? Math.max(defaultDelayMs, retryAfterMs) : defaultDelayMs;
}
