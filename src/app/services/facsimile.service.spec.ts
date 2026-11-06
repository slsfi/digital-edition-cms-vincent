import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FacsimileService } from './facsimile.service';
import { ProjectService } from './project.service';
import { SnackbarService } from './snackbar.service';

describe('FacsimileService', () => {
  let service: FacsimileService;
  let http: HttpTestingController;
  let showError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    showError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProjectService, useValue: { selectedProject$: of('test-project') } },
        { provide: SnackbarService, useValue: { show: showError } }
      ]
    });
    service = TestBed.inject(FacsimileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it.each([false, true])('preserves creation errors while allowing bulk operations to suppress popups: %s', suppressErrors => {
    const data = {
      title: 'Publication',
      description: null,
      folder_path: null,
      external_url: null,
      number_of_pages: 4,
      start_page_number: 0
    };
    const response$ = suppressErrors
      ? service.addFacsimileCollection(data, 'test-project', true)
      : service.addFacsimileCollection(data, 'test-project');
    let receivedError: unknown;
    response$.subscribe({
      next: () => expect.fail('Expected a creation error'),
      error: error => { receivedError = error; }
    });

    http.expectOne(request => request.url.endsWith('/facsimile_collection/new/'))
      .flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });

    expect(receivedError).toMatchObject({ status: 429 });
    if (suppressErrors) {
      expect(showError).not.toHaveBeenCalled();
    } else {
      expect(showError).toHaveBeenCalledWith('Too many requests', 'error');
    }
  });
});
