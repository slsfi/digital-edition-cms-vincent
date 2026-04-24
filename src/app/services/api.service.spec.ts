import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { SnackbarService } from './snackbar.service';

describe('ApiService', () => {
  let service: ApiService;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  function createError(errorBody: unknown): HttpErrorResponse {
    return new HttpErrorResponse({
      error: errorBody,
      status: 403,
      statusText: 'Forbidden',
      url: '/api/resource'
    });
  }

  function expectSnackbarMessage(errorBody: unknown, expectedMessage: string): void {
    const error = createError(errorBody);
    let receivedError: unknown;

    service.handleError(error).subscribe({
      next: () => fail('expected handleError to rethrow'),
      error: (err) => {
        receivedError = err;
      }
    });

    expect(receivedError).toBe(error);
    expect(snackbar.show).toHaveBeenCalledWith(expectedMessage, 'error');
    snackbar.show.calls.reset();
  }

  beforeEach(() => {
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['show']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: SnackbarService, useValue: snackbar }
      ]
    });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shows backend error messages from known response fields', () => {
    expectSnackbarMessage({ message: 'Forbidden' }, 'Forbidden');
    expectSnackbarMessage({ msg: 'Access denied' }, 'Access denied');
  });

  it('shows string backend error bodies directly', () => {
    expectSnackbarMessage('Forbidden', 'Forbidden');
  });

  it('falls back to the HTTP error message when the backend error body has no message', () => {
    for (const errorBody of [undefined, null, '', { message: '' }, { msg: '' }]) {
      const error = createError(errorBody);
      let receivedError: unknown;

      service.handleError(error).subscribe({
        next: () => fail('expected handleError to rethrow'),
        error: (err) => {
          receivedError = err;
        }
      });

      expect(receivedError).toBe(error);
      expect(snackbar.show).toHaveBeenCalledWith(error.message, 'error');
      snackbar.show.calls.reset();
    }
  });

  it('does not show a snackbar when error messages are disabled', () => {
    const error = createError({ message: 'Forbidden' });

    service.handleError(error, true).subscribe({
      next: () => fail('expected handleError to rethrow'),
      error: () => undefined
    });

    expect(snackbar.show).not.toHaveBeenCalled();
  });
});
