import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FacsimileCreationConfig, FacsimileCreationSummary } from '../models/facsimile.model';
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

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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

  describe('bulk creation', () => {
    const config: FacsimileCreationConfig = {
      publicationCollectionId: 10,
      numberOfPages: 4,
      startPageNumber: 0,
      titleSource: 'publication',
      description: 'Collection description'
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockReturnValue(undefined);
    });

    it('paces each request after the previous response and reports publication progress', async () => {
      const progress = vi.fn();
      const summary = vi.fn();
      service.createFacsimilesFromPublications(config, 'test-project', progress).subscribe(summary);

      const list = expectRequest('/publication_collection/10/publications/id/');
      await vi.advanceTimersByTimeAsync(500);
      http.expectNone(() => true);
      expect(progress).not.toHaveBeenCalled();
      list.flush({ data: [{ id: 1, name: 'First' }, { id: 2, name: 'Second' }] });
      expect(progress.mock.calls).toEqual([[1, 2]]);

      await vi.advanceTimersByTimeAsync(149);
      http.expectNone(() => true);
      await vi.advanceTimersByTimeAsync(1);
      const firstCreate = expectRequest('/facsimile_collection/new/');
      expect(firstCreate.request.method).toBe('POST');
      expect(firstCreate.request.body).toEqual({
        title: 'First', description: config.description, folder_path: '', external_url: '',
        number_of_pages: 4, start_page_number: 0
      });
      await vi.advanceTimersByTimeAsync(500);
      http.expectNone(() => true);
      expect(progress).toHaveBeenCalledTimes(1);
      firstCreate.flush({ data: { id: 77 } });

      await vi.advanceTimersByTimeAsync(149);
      http.expectNone(() => true);
      await vi.advanceTimersByTimeAsync(1);
      const firstLink = expectRequest('/facsimile_collection/77/link/');
      expect(firstLink.request.body).toEqual({ publication_id: 1, page_nr: 1, section_id: 0, priority: 1, type: 0 });
      await vi.advanceTimersByTimeAsync(500);
      http.expectNone(() => true);
      expect(progress).toHaveBeenCalledTimes(1);
      expect(summary).not.toHaveBeenCalled();
      firstLink.flush({ data: {} });
      expect(progress.mock.calls).toEqual([[1, 2], [2, 2]]);

      await vi.advanceTimersByTimeAsync(150);
      const secondCreate = expectRequest('/facsimile_collection/new/');
      expect(secondCreate.request.body.title).toBe('Second');
      secondCreate.flush({ data: { id: 88 } });
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/88/link/').flush({ data: {} });

      expect(summary).toHaveBeenCalledExactlyOnceWith({
        total: 2, successful: 2, failed: 0,
        results: [
          { success: true, publicationId: 1, publicationName: 'First', facsimileId: 77, facsimileTitle: 'First', index: 1, total: 2 },
          { success: true, publicationId: 2, publicationName: 'Second', facsimileId: 88, facsimileTitle: 'Second', index: 2, total: 2 }
        ]
      });
      expect(showError).not.toHaveBeenCalled();
    });

    it('includes manuscript lookups in the pacing and preserves title selection and fallback', async () => {
      const summary = vi.fn();
      service.createFacsimilesFromPublications({ ...config, titleSource: 'manuscript' }, 'test-project').subscribe(summary);
      expectRequest('/publication_collection/10/publications/id/').flush({
        data: [{ id: 1, name: 'Publication title' }, { id: 2, name: null }]
      });

      await vi.advanceTimersByTimeAsync(149);
      http.expectNone(() => true);
      await vi.advanceTimersByTimeAsync(1);
      expectRequest('/publication/1/manuscripts/').flush({ data: [{ name: 'First manuscript' }, { name: 'Second manuscript' }] });
      await vi.advanceTimersByTimeAsync(149);
      http.expectNone(() => true);
      await vi.advanceTimersByTimeAsync(1);
      const firstCreate = expectRequest('/facsimile_collection/new/');
      expect(firstCreate.request.body.title).toBe('First manuscript');
      firstCreate.flush({ data: { id: 77 } });
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/77/link/').flush({ data: {} });

      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/publication/2/manuscripts/').flush({ data: [] });
      await vi.advanceTimersByTimeAsync(150);
      const secondCreate = expectRequest('/facsimile_collection/new/');
      expect(secondCreate.request.body.title).toBe('Publication 2');
      secondCreate.flush({ data: { id: 88 } });
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/88/link/').flush({ data: {} });
      expect(summary).toHaveBeenCalledWith(expect.objectContaining({ total: 2, successful: 2, failed: 0 }));
    });

    it('waits one second after ten backend requests, counting the list, creation, and linking', async () => {
      const summary = vi.fn();
      service.createFacsimilesFromPublications(config, 'test-project').subscribe(summary);
      flushPublications(6);

      for (let index = 1; index <= 4; index++) {
        await vi.advanceTimersByTimeAsync(150);
        expectRequest('/facsimile_collection/new/').flush({ data: { id: index } });
        await vi.advanceTimersByTimeAsync(150);
        expectRequest(`/facsimile_collection/${index}/link/`).flush({ data: {} });
      }
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/new/').flush({ data: { id: 5 } });
      await vi.advanceTimersByTimeAsync(999);
      http.expectNone(() => true);
      await vi.advanceTimersByTimeAsync(1);
      expectRequest('/facsimile_collection/5/link/').flush({ data: {} });

      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/new/').flush({ data: { id: 6 } });
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/6/link/').flush({ data: {} });
      expect(summary).toHaveBeenCalledWith(expect.objectContaining({ total: 6, successful: 6, failed: 0 }));
    });

    it.each([
      { stage: 'manuscript', status: 429, delayMs: 5000, retryAfter: undefined },
      { stage: 'create', status: 429, delayMs: 5000, retryAfter: undefined },
      { stage: 'link', status: 429, delayMs: 5000, retryAfter: undefined },
      { stage: 'link', status: 503, delayMs: 8000, retryAfter: '8' },
      { stage: 'create', status: 422, delayMs: 150, retryAfter: undefined }
    ])('continues after a $stage failure ($status) using the appropriate delay', async ({ stage, status, delayMs, retryAfter }) => {
      const progress = vi.fn();
      const summary = vi.fn();
      const titleSource = stage === 'manuscript' ? 'manuscript' : 'publication';
      service.createFacsimilesFromPublications({ ...config, titleSource }, 'test-project', progress).subscribe(summary);
      flushPublications(2);
      await vi.advanceTimersByTimeAsync(150);
      let failedRequest;
      if (stage === 'manuscript') {
        failedRequest = expectRequest('/publication/1/manuscripts/');
      } else {
        failedRequest = expectRequest('/facsimile_collection/new/');
        if (stage === 'link') {
          failedRequest.flush({ data: { id: 77 } });
          await vi.advanceTimersByTimeAsync(150);
          failedRequest = expectRequest('/facsimile_collection/77/link/');
        }
      }
      failedRequest.flush({ message: 'Backend failure' }, {
        status, statusText: 'Backend failure', headers: retryAfter ? { 'Retry-After': retryAfter } : {}
      });
      expect(progress.mock.calls).toEqual([[1, 2], [2, 2]]);
      expect(showError).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(delayMs - 1);
      http.expectNone(() => true);
      await vi.advanceTimersByTimeAsync(1);
      if (stage === 'manuscript') {
        expectRequest('/publication/2/manuscripts/').flush({ data: [] });
        await vi.advanceTimersByTimeAsync(150);
      }
      expectRequest('/facsimile_collection/new/').flush({ data: { id: 88 } });
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/88/link/').flush({ data: {} });

      expect(summary).toHaveBeenCalledExactlyOnceWith({
        total: 2, successful: 1, failed: 1,
        results: [
          expect.objectContaining({ success: false, publicationId: 1, index: 1, total: 2, error: expect.any(String) }),
          expect.objectContaining({ success: true, publicationId: 2, index: 2, total: 2 })
        ]
      });
      expect(showError).not.toHaveBeenCalled();
    });

    it('propagates a publication-list failure without an individual error popup', () => {
      const progress = vi.fn();
      const summary = vi.fn();
      const error = vi.fn();
      service.createFacsimilesFromPublications(config, 'test-project', progress).subscribe({ next: summary, error });
      expectRequest('/publication_collection/10/publications/id/')
        .flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
      expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));
      expect(summary).not.toHaveBeenCalled();
      expect(progress).not.toHaveBeenCalled();
      expect(showError).not.toHaveBeenCalled();
    });

    it('returns an empty summary immediately for an empty collection', () => {
      const progress = vi.fn();
      const summary = vi.fn();
      service.createFacsimilesFromPublications(config, 'test-project', progress).subscribe(summary);
      flushPublications(0);
      expect(summary).toHaveBeenCalledExactlyOnceWith({ total: 0, successful: 0, failed: 0, results: [] });
      expect(progress).not.toHaveBeenCalled();
    });

    it('starts with fresh pacing state for each subscription to the bulk observable', async () => {
      const summary = vi.fn();
      const operation$ = service.createFacsimilesFromPublications(config, 'test-project');
      operation$.subscribe(summary);
      flushPublications(1);
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/new/')
        .flush({ message: 'Busy' }, { status: 429, statusText: 'Too Many Requests' });

      operation$.subscribe(summary);
      flushPublications(1);
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/new/').flush({ data: { id: 88 } });
      await vi.advanceTimersByTimeAsync(150);
      expectRequest('/facsimile_collection/88/link/').flush({ data: {} });
      expect(summary).toHaveBeenCalledTimes(2);
      expect(summary.mock.calls[1][0]).toMatchObject({ total: 1, successful: 1, failed: 0 });
    });

    it.each(['list', 'pause', 'manuscript', 'create', 'link', 'cooldown'])('cancels during %s without emitting a partial summary or starting more requests', async stage => {
      const summary = vi.fn<(summary: FacsimileCreationSummary) => void>();
      const progress = vi.fn();
      const subscription = service.createFacsimilesFromPublications({ ...config, titleSource: 'manuscript' }, 'test-project', progress).subscribe(summary);
      let pendingRequest = expectRequest('/publication_collection/10/publications/id/');
      if (stage !== 'list') {
        pendingRequest.flush({ data: [{ id: 1, name: 'First' }, { id: 2, name: 'Second' }] });
        if (stage !== 'pause') {
          await vi.advanceTimersByTimeAsync(150);
          pendingRequest = expectRequest('/publication/1/manuscripts/');
          if (stage !== 'manuscript') {
            pendingRequest.flush({ data: [] });
            await vi.advanceTimersByTimeAsync(150);
            pendingRequest = expectRequest('/facsimile_collection/new/');
            if (stage === 'link') {
              pendingRequest.flush({ data: { id: 77 } });
              await vi.advanceTimersByTimeAsync(150);
              pendingRequest = expectRequest('/facsimile_collection/77/link/');
            } else if (stage === 'cooldown') {
              pendingRequest.flush({ message: 'Busy' }, { status: 429, statusText: 'Too Many Requests' });
            }
          }
        }
      }

      const progressCount = progress.mock.calls.length;
      subscription.unsubscribe();
      if (!['pause', 'cooldown'].includes(stage)) {
        expect(pendingRequest.cancelled).toBe(true);
      }
      await vi.advanceTimersByTimeAsync(10000);
      http.expectNone(() => true);
      expect(summary).not.toHaveBeenCalled();
      expect(progress).toHaveBeenCalledTimes(progressCount);
      expect(showError).not.toHaveBeenCalled();
    });

    function expectRequest(suffix: string) {
      return http.expectOne(request => request.url.endsWith(suffix));
    }

    function flushPublications(count: number): void {
      expectRequest('/publication_collection/10/publications/id/').flush({
        data: Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Publication ${index + 1}` }))
      });
    }
  });
});
