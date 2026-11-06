import type { MockedObject } from "vitest";
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { PublicationsComponent } from './publications.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { Deleted, Published } from '../../models/common.model';
import { FacsimileCollectionResponse, LinkFacsimileToPublicationResponse } from '../../models/facsimile.model';
import { Publication, PublicationResponse, XmlMetadata } from '../../models/publication.model';
import { FacsimileService } from '../../services/facsimile.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { QueryParamsService } from '../../services/query-params.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('PublicationsComponent', () => {
    let component: PublicationsComponent;
    let fixture: ComponentFixture<PublicationsComponent>;
    let dialog: MockedObject<Pick<MatDialog, 'open'>>;
    let facsimileService: MockedObject<Pick<FacsimileService, 'addFacsimileCollection'>>;
    let projectService: MockedObject<Pick<ProjectService, 'getCurrentProject'>>;
    let publicationService: MockedObject<Pick<PublicationService,
        'addPublication' |
        'editPublication' |
        'getCommentsForPublication' |
        'getFacsimilesForPublication' |
        'getManuscriptsForPublication' |
        'getMetadataFromXML' |
        'getPublications' |
        'getVersionsForPublication' |
        'linkFacsimileToPublication' |
        'linkTextToPublication'>>;
    let snackbar: MockedObject<Pick<SnackbarService, 'show' | 'showProgress'>>;
    let dismissProgress: ReturnType<typeof vi.fn<() => void>>;
    let consoleWarn: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        const originalWarn = console.warn;
        consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
            if (!String(args[0]).includes('NG0914')) {
                originalWarn(...args);
            }
        });
        dialog = {
            open: vi.fn().mockName("MatDialog.open")
        };
        facsimileService = {
            addFacsimileCollection: vi.fn().mockName("FacsimileService.addFacsimileCollection")
        };
        projectService = {
            getCurrentProject: vi.fn().mockName("ProjectService.getCurrentProject")
        };
        publicationService = {
            addPublication: vi.fn().mockName("PublicationService.addPublication"),
            editPublication: vi.fn().mockName("PublicationService.editPublication"),
            getCommentsForPublication: vi.fn().mockName("PublicationService.getCommentsForPublication"),
            getFacsimilesForPublication: vi.fn().mockName("PublicationService.getFacsimilesForPublication"),
            getManuscriptsForPublication: vi.fn().mockName("PublicationService.getManuscriptsForPublication"),
            getMetadataFromXML: vi.fn().mockName("PublicationService.getMetadataFromXML"),
            getPublications: vi.fn().mockName("PublicationService.getPublications"),
            getVersionsForPublication: vi.fn().mockName("PublicationService.getVersionsForPublication"),
            linkFacsimileToPublication: vi.fn().mockName("PublicationService.linkFacsimileToPublication"),
            linkTextToPublication: vi.fn().mockName("PublicationService.linkTextToPublication")
        };
        dismissProgress = vi.fn<() => void>();
        snackbar = {
            show: vi.fn().mockName("SnackbarService.show"),
            showProgress: vi.fn().mockName('SnackbarService.showProgress').mockReturnValue({
                dismiss: dismissProgress
            } as unknown as ReturnType<SnackbarService['showProgress']>)
        };

        projectService.getCurrentProject.mockReturnValue('test-project');
        publicationService.getPublications.mockReturnValue(of([]));
        publicationService.getCommentsForPublication.mockReturnValue(of([]));
        publicationService.getFacsimilesForPublication.mockReturnValue(of([]));
        publicationService.getManuscriptsForPublication.mockReturnValue(of([]));
        publicationService.getVersionsForPublication.mockReturnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [PublicationsComponent],
            providers: [
                ...getCommonTestingProviders(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of(convertToParamMap({ collectionId: '5' }))
                    }
                },
                { provide: MatDialog, useValue: dialog },
                { provide: FacsimileService, useValue: facsimileService },
                { provide: ProjectService, useValue: projectService },
                { provide: PublicationService, useValue: publicationService },
                {
                    provide: QueryParamsService,
                    useValue: {
                        queryParams$: of({}),
                        sortParams$: of([]),
                        filterParams$: of([]),
                        pageParams$: of([]),
                        getPageNumber: () => '1'
                    }
                },
                { provide: SnackbarService, useValue: snackbar },
                { provide: LoadingService, useValue: { loading$: of(false) } }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PublicationsComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        fixture.destroy();
        vi.useRealTimers();
        consoleWarn.mockRestore();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create and link a facsimile collection when adding a publication with link_facsimile enabled', () => {
        dialog.open.mockReturnValue({
            afterClosed: () => of({
                form: new FormGroup({
                    name: new FormControl('Publication title'),
                    published: new FormControl(Published.PublishedInternally),
                    link_facsimile: new FormControl(true),
                    link_manuscript: new FormControl(false)
                })
            })
        } as never);
        publicationService.addPublication.mockReturnValue(of(publicationResponse({
            id: 42,
            name: 'Publication title'
        })));
        facsimileService.addFacsimileCollection.mockReturnValue(of(facsimileCollectionResponse(77)));
        publicationService.linkFacsimileToPublication.mockReturnValue(of(linkFacsimileResponse()));

        component.editPublication(null, '5');

        expect(facsimileService.addFacsimileCollection).toHaveBeenCalledWith({
            title: 'Publication title',
            description: null,
            folder_path: null,
            external_url: null,
            number_of_pages: 4,
            start_page_number: 0
        }, 'test-project');
        expect(publicationService.linkFacsimileToPublication).toHaveBeenCalledWith(77, {
            publication_id: 42,
            page_nr: 1,
            section_id: 0,
            priority: 1,
            type: 0
        }, 'test-project');
        expect(snackbar.show).toHaveBeenCalledWith('Publication saved.');
    });

    it('removes the metadata-update spinner after the asynchronous update completes', async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        vi.useFakeTimers();

        const publications$ = new Subject<Publication[]>();
        const metadata$ = new Subject<XmlMetadata>();
        publicationService.getPublications.mockReturnValue(publications$);
        publicationService.getMetadataFromXML.mockReturnValue(metadata$);
        publicationService.editPublication.mockReturnValue(of(publicationResponse({ id: 42 })));
        dialog.open.mockReturnValue({
            afterClosed: () => of({
                value: true,
                selectedMetadataFields: { name: true }
            })
        } as never);

        component.updateMetadataAll('5');
        await vi.advanceTimersByTimeAsync(1);
        await fixture.whenStable();

        expect(component.metadataUpdating()).toBe(true);
        expect(fixture.nativeElement.querySelector('loading-spinner')).not.toBeNull();

        publications$.next([publication({
            id: 42,
            name: 'Old title',
            original_filename: 'document.xml'
        })]);
        await vi.advanceTimersByTimeAsync(150);
        metadata$.next({
            genre: 'Novel',
            language: 'sv',
            name: 'Updated title',
            original_publication_date: '1900'
        });
        await vi.advanceTimersByTimeAsync(151);
        await fixture.whenStable();

        expect(publicationService.editPublication).toHaveBeenCalledWith(
            42,
            { name: 'Updated title' },
            'test-project',
            true
        );
        expect(component.metadataUpdating()).toBe(false);
        expect(fixture.nativeElement.querySelector('loading-spinner')).toBeNull();
    });
  describe('bulk metadata update throttling', () => {
    const publications = [
      publication({ id: 1, original_filename: 'first.xml' }),
      publication({ id: 2, original_filename: 'second.xml' })
    ];
    const metadata: XmlMetadata = {
      name: 'XML title', language: 'sv', genre: 'Novel', original_publication_date: '1900'
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockReturnValue(undefined);
      publicationService.getPublications.mockReturnValue(of(publications));
      publicationService.getMetadataFromXML.mockReturnValue(of(metadata));
      publicationService.editPublication.mockReturnValue(of(publicationResponse({ id: 1 })));
      dialog.open.mockReturnValue({
        afterClosed: () => of({ value: true, selectedMetadataFields: { name: true } })
      } as never);
    });

    it('paces the list, metadata and save calls sequentially and updates one persistent progress snackbar', async () => {
      const metadata$ = new Subject<XmlMetadata>();
      const saved$ = new Subject<PublicationResponse>();
      publicationService.getMetadataFromXML.mockReturnValueOnce(metadata$);
      publicationService.editPublication.mockReturnValueOnce(saved$);
      const refresh = vi.spyOn(component.publicationsLoader$, 'next');

      component.updateMetadataAll('5');
      component.updateMetadataAll('5');
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(publicationService.getPublications).toHaveBeenCalledExactlyOnceWith('5', 'test-project', true);
      expect(publicationService.getMetadataFromXML).not.toHaveBeenCalled();
      expect(snackbar.showProgress).toHaveBeenCalledTimes(1);
      const progressMessage = snackbar.showProgress.mock.calls[0][0];
      expect(progressMessage()).toBe('Updating XML metadata 1 / 2…');

      await vi.advanceTimersByTimeAsync(149);
      expect(publicationService.getMetadataFromXML).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledExactlyOnceWith('first.xml', 'test-project', true);
      await vi.advanceTimersByTimeAsync(1000);
      expect(publicationService.editPublication).not.toHaveBeenCalled();
      metadata$.next(metadata);
      await vi.advanceTimersByTimeAsync(149);
      expect(publicationService.editPublication).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.editPublication).toHaveBeenCalledExactlyOnceWith(1, { name: 'XML title' }, 'test-project', true);

      await vi.advanceTimersByTimeAsync(1000);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      expect(progressMessage()).toBe('Updating XML metadata 1 / 2…');
      expect(component.metadataUpdating()).toBe(true);
      expect(dismissProgress).not.toHaveBeenCalled();
      saved$.next(publicationResponse({ id: 1 }));
      expect(progressMessage()).toBe('Updating XML metadata 2 / 2…');
      await vi.advanceTimersByTimeAsync(149);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.getMetadataFromXML).toHaveBeenNthCalledWith(2, 'second.xml', 'test-project', true);
      await vi.advanceTimersByTimeAsync(150);

      expect(publicationService.editPublication).toHaveBeenNthCalledWith(2, 2, { name: 'XML title' }, 'test-project', true);
      expect(component.metadataUpdating()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledWith('Successfully updated metadata of all publications.');
      expect(dismissProgress).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('pauses after every ten backend attempts, counting both reads and writes', async () => {
      const calls: string[] = [];
      // Subsequent list requests belong to the table rather than the bulk operation.
      publicationService.getPublications.mockReturnValue(of([])).mockImplementationOnce(() => {
        calls.push('list');
        return of(Array.from({ length: 6 }, (_, index) => publication({ id: index + 1, original_filename: `file-${index + 1}.xml` })));
      });
      publicationService.getMetadataFromXML.mockImplementation(path => {
        calls.push(`metadata:${path}`);
        return of(metadata);
      });
      publicationService.editPublication.mockImplementation(id => {
        calls.push(`save:${id}`);
        return of(publicationResponse({ id }));
      });

      component.updateMetadataAll('5');
      expect(calls).toEqual(['list']);
      await vi.advanceTimersByTimeAsync(1350);
      expect(calls).toHaveLength(10);
      expect(calls[9]).toBe('metadata:file-5.xml');
      await vi.advanceTimersByTimeAsync(999);
      expect(calls).toHaveLength(10);
      await vi.advanceTimersByTimeAsync(1);
      expect(calls[10]).toBe('save:5');
      await vi.advanceTimersByTimeAsync(300);

      expect(calls).toEqual([
        'list', 'metadata:file-1.xml', 'save:1', 'metadata:file-2.xml', 'save:2',
        'metadata:file-3.xml', 'save:3', 'metadata:file-4.xml', 'save:4',
        'metadata:file-5.xml', 'save:5', 'metadata:file-6.xml', 'save:6'
      ]);
      expect(component.metadataUpdating()).toBe(false);
      expect(dismissProgress).toHaveBeenCalledTimes(1);
    });

    it.each([
      { stage: 'fetch', status: 429, failureAtMs: 150, pauseMs: 5000, retryAfter: '' },
      { stage: 'save', status: 503, failureAtMs: 300, pauseMs: 8000, retryAfter: '8' },
      { stage: 'fetch', status: 422, failureAtMs: 150, pauseMs: 150, retryAfter: '' }
    ])('continues after a $stage failure with status $status using a $pauseMs ms pause', async ({ stage, status, failureAtMs, pauseMs, retryAfter }) => {
      const failure$ = throwError(() => new HttpErrorResponse({ status, headers: new HttpHeaders({ 'Retry-After': retryAfter }) }));
      if (stage === 'fetch') {
        publicationService.getMetadataFromXML.mockReturnValueOnce(failure$);
      } else {
        publicationService.editPublication.mockReturnValueOnce(failure$);
      }
      const refresh = vi.spyOn(component.publicationsLoader$, 'next');

      component.updateMetadataAll('5');
      await vi.advanceTimersByTimeAsync(failureAtMs);
      expect(component.metadataUpdateFailures).toEqual([1]);
      expect(snackbar.showProgress.mock.calls[0][0]()).toBe('Updating XML metadata 2 / 2…');
      await vi.advanceTimersByTimeAsync(pauseMs - 1);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.getMetadataFromXML.mock.calls.map(([path]) => path)).toEqual(['first.xml', 'second.xml']);
      await vi.advanceTimersByTimeAsync(150);

      expect(snackbar.show).toHaveBeenCalledWith('Failed to update metadata of 1 / 2 publication(s) with ID:\n1', 'warning');
      expect(component.metadataUpdating()).toBe(false);
      expect(dismissProgress).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('updates only the selected fields, including null and empty values from XML', async () => {
      dialog.open.mockReturnValue({
        afterClosed: () => of({ value: true, selectedMetadataFields: { name: false, language: true, genre: true } })
      } as never);
      publicationService.getPublications.mockReturnValue(of([publications[0]]));
      publicationService.getMetadataFromXML.mockReturnValue(of({ ...metadata, language: null, genre: '' }));

      component.updateMetadataAll('5');
      await vi.advanceTimersByTimeAsync(300);

      expect(publicationService.editPublication).toHaveBeenCalledExactlyOnceWith(1, { language: null, genre: '' }, 'test-project', true);
      expect(component.metadataUpdateFailures).toEqual([]);
    });

    it('skips publications without XML paths and advances progress to the next publication', async () => {
      publicationService.getPublications.mockReturnValue(of([publication({ id: 3 }), publications[1]]));

      component.updateMetadataAll('5');
      expect(snackbar.showProgress.mock.calls[0][0]()).toBe('Updating XML metadata 2 / 2…');
      await vi.advanceTimersByTimeAsync(300);

      expect(publicationService.getMetadataFromXML).toHaveBeenCalledExactlyOnceWith('second.xml', 'test-project', true);
      expect(publicationService.editPublication).toHaveBeenCalledExactlyOnceWith(2, { name: 'XML title' }, 'test-project', true);
    });

    it('clears the spinner and progress snackbar if fetching the publication list fails', () => {
      publicationService.getPublications.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
      const refresh = vi.spyOn(component.publicationsLoader$, 'next');

      component.updateMetadataAll('5');

      expect(component.metadataUpdating()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledExactlyOnceWith('Error fetching publication list.', 'error');
      expect(dismissProgress).toHaveBeenCalledTimes(1);
      expect(publicationService.getMetadataFromXML).not.toHaveBeenCalled();
      expect(publicationService.editPublication).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });

    it('finishes without making metadata requests for an empty collection', () => {
      publicationService.getPublications.mockReturnValue(of([]));

      component.updateMetadataAll('5');

      expect(component.metadataUpdating()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledExactlyOnceWith('No publications found in this collection.', 'info');
      expect(dismissProgress).toHaveBeenCalledTimes(1);
      expect(publicationService.getMetadataFromXML).not.toHaveBeenCalled();
    });

    it.each([
      { value: false, selectedMetadataFields: { name: true } },
      { value: true, selectedMetadataFields: {} },
      { value: true, selectedMetadataFields: { name: false, language: false, genre: false, original_publication_date: false } }
    ])('avoids backend requests when cancelled or no fields are selected: %j', result => {
      dialog.open.mockReturnValue({ afterClosed: () => of(result) } as never);

      component.updateMetadataAll('5');

      expect(component.metadataUpdating()).toBe(false);
      expect(publicationService.getPublications).not.toHaveBeenCalled();
      expect(snackbar.showProgress).not.toHaveBeenCalled();
      if (result.value) {
        expect(snackbar.show).toHaveBeenCalledExactlyOnceWith('No metadata fields selected for update.', 'info');
      } else {
        expect(snackbar.show).not.toHaveBeenCalled();
      }
    });

    it.each([
      { stage: 'list', elapsedMs: 0 },
      { stage: 'fetch', elapsedMs: 150 },
      { stage: 'save', elapsedMs: 300 },
      { stage: 'pause', elapsedMs: 300 },
      { stage: 'failure pause', elapsedMs: 150 }
    ])('cancels work and dismisses progress when destroyed during $stage', async ({ stage, elapsedMs }) => {
      const list$ = new Subject<Publication[]>();
      const metadata$ = new Subject<XmlMetadata>();
      const saved$ = new Subject<PublicationResponse>();
      if (stage === 'list') publicationService.getPublications.mockReturnValue(list$);
      if (stage === 'fetch') publicationService.getMetadataFromXML.mockReturnValue(metadata$);
      if (stage === 'save') publicationService.editPublication.mockReturnValue(saved$);
      if (stage === 'failure pause') publicationService.getMetadataFromXML.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 429 })));
      const refresh = vi.spyOn(component.publicationsLoader$, 'next');
      component.updateMetadataAll('5');
      await vi.advanceTimersByTimeAsync(elapsedMs);
      const fetchCount = publicationService.getMetadataFromXML.mock.calls.length;
      const saveCount = publicationService.editPublication.mock.calls.length;

      fixture.destroy();
      await vi.runAllTimersAsync();

      expect(component.metadataUpdating()).toBe(false);
      expect(list$.observed).toBe(false);
      expect(metadata$.observed).toBe(false);
      expect(saved$.observed).toBe(false);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(fetchCount);
      expect(publicationService.editPublication).toHaveBeenCalledTimes(saveCount);
      expect(snackbar.show).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(dismissProgress).toHaveBeenCalledTimes(1);
    });

    it('ignores confirmation received after leaving the page', () => {
      const confirmation$ = new Subject<{ value: boolean; selectedMetadataFields: Record<string, boolean> }>();
      dialog.open.mockReturnValue({ afterClosed: () => confirmation$ } as never);
      component.updateMetadataAll('5');

      fixture.destroy();
      confirmation$.next({ value: true, selectedMetadataFields: { name: true } });

      expect(confirmation$.observed).toBe(false);
      expect(publicationService.getPublications).not.toHaveBeenCalled();
      expect(snackbar.showProgress).not.toHaveBeenCalled();
    });
  });
});

function publicationResponse(values: Partial<Publication>): PublicationResponse {
    return {
        success: true,
        message: '',
        data: publication(values)
    };
}

function publication(values: Partial<Publication>): Publication {
    return {
        date_created: '',
        date_modified: null,
        deleted: Deleted.NotDeleted,
        genre: null,
        id: 1,
        language: null,
        name: null,
        original_filename: null,
        original_publication_date: null,
        publication_collection_id: 1,
        publication_comment_id: null,
        published: Published.PublishedInternally,
        ...values
    };
}

function facsimileCollectionResponse(id: number): FacsimileCollectionResponse {
    return {
        success: true,
        message: '',
        data: {
            date_created: '',
            date_modified: null,
            deleted: Deleted.NotDeleted,
            description: null,
            external_url: null,
            folder_path: null,
            id,
            number_of_pages: 4,
            page_comment: null,
            start_page_number: 0,
            title: 'Publication title'
        }
    };
}

function linkFacsimileResponse(): LinkFacsimileToPublicationResponse {
    return {
        success: true,
        message: '',
        data: {
            date_created: '',
            date_modified: null,
            deleted: Deleted.NotDeleted,
            id: 1,
            page_nr: 1,
            priority: 1,
            publication_facsimile_collection_id: 77,
            publication_id: 42,
            publication_manuscript_id: null,
            publication_version_id: null,
            section_id: 0,
            type: 0
        }
    };
}
