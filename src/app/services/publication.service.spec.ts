import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublicationService } from './publication.service';
import { SnackbarService } from './snackbar.service';

describe('PublicationService', () => {
  let service: PublicationService;
  let http: HttpTestingController;
  let showError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    showError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: { show: showError } }
      ]
    });
    service = TestBed.inject(PublicationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it.each([false, true])('preserves facsimile linking errors while allowing bulk operations to suppress popups: %s', suppressErrors => {
    const data = { publication_id: 42, page_nr: 1, section_id: 0, priority: 1, type: 0 };
    const response$ = suppressErrors
      ? service.linkFacsimileToPublication(77, data, 'test-project', true)
      : service.linkFacsimileToPublication(77, data, 'test-project');
    let receivedError: unknown;
    response$.subscribe({
      next: () => expect.fail('Expected a linking error'),
      error: error => { receivedError = error; }
    });

    http.expectOne(request => request.url.endsWith('/facsimile_collection/77/link/'))
      .flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });

    expect(receivedError).toMatchObject({ status: 429 });
    if (suppressErrors) {
      expect(showError).not.toHaveBeenCalled();
    } else {
      expect(showError).toHaveBeenCalledWith('Too many requests', 'error');
    }
  });
});
