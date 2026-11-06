import type { MockedObject } from "vitest";
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { AddPublicationsFromFilesComponent } from './add-publications-from-files.component';
import { Deleted, Published } from '../../models/common.model';
import { FacsimileCollectionResponse, LinkFacsimileToPublicationResponse } from '../../models/facsimile.model';
import { LinkTextToPublicationResponse, Publication, PublicationResponse, XmlMetadata } from '../../models/publication.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('AddPublicationsFromFilesComponent', () => {
    let component: AddPublicationsFromFilesComponent;
    let fixture: ComponentFixture<AddPublicationsFromFilesComponent>;
    let facsimileService: MockedObject<Pick<FacsimileService, 'addFacsimileCollection'>>;
    let publicationService: MockedObject<Pick<PublicationService,
        'getPublicationCollections' |
        'getPublications' |
        'getMetadataFromXML' |
        'addPublication' |
        'linkFacsimileToPublication' |
        'linkTextToPublication'>>;
    let projectService: MockedObject<Pick<ProjectService, 'getCurrentProject'>>;
    let snackbar: MockedObject<Pick<SnackbarService, 'show'>>;
    let consoleWarn: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        const originalWarn = console.warn;
        consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
            if (!String(args[0]).includes('NG0914')) {
                originalWarn(...args);
            }
        });
        facsimileService = {
            addFacsimileCollection: vi.fn().mockName("FacsimileService.addFacsimileCollection")
        };
        publicationService = {
            getPublicationCollections: vi.fn().mockName("PublicationService.getPublicationCollections"),
            getPublications: vi.fn().mockName("PublicationService.getPublications"),
            getMetadataFromXML: vi.fn().mockName("PublicationService.getMetadataFromXML"),
            addPublication: vi.fn().mockName("PublicationService.addPublication"),
            linkFacsimileToPublication: vi.fn().mockName("PublicationService.linkFacsimileToPublication"),
            linkTextToPublication: vi.fn().mockName("PublicationService.linkTextToPublication")
        };
        projectService = {
            getCurrentProject: vi.fn().mockName("ProjectService.getCurrentProject")
        };
        snackbar = {
            show: vi.fn().mockName("SnackbarService.show")
        };

        projectService.getCurrentProject.mockReturnValue('test-project');
        publicationService.getPublicationCollections.mockReturnValue(of([]));
        publicationService.getPublications.mockReturnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [AddPublicationsFromFilesComponent],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: { collectionId: '1' },
                            queryParams: {},
                            paramMap: convertToParamMap({ collectionId: '1' }),
                            queryParamMap: convertToParamMap({})
                        },
                        params: of({ collectionId: '1' }),
                        queryParams: of({}),
                        paramMap: of(convertToParamMap({ collectionId: '1' })),
                        queryParamMap: of(convertToParamMap({})),
                        data: of({}),
                        fragment: of(null),
                        url: of([])
                    }
                },
                { provide: ProjectService, useValue: projectService },
                { provide: FacsimileService, useValue: facsimileService },
                { provide: PublicationService, useValue: publicationService },
                { provide: SnackbarService, useValue: snackbar }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AddPublicationsFromFilesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.useRealTimers();
        consoleWarn.mockRestore();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should trim existing publication file paths before duplicate checks', () => {
        vi.spyOn(console, 'log').mockReturnValue(undefined);
        publicationService.getPublications.mockReturnValue(of([
            publication({ original_filename: ' data/texts/already-added.xml ' })
        ]));
        fixture = TestBed.createComponent(AddPublicationsFromFilesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.selectedFiles([
            'data/texts/already-added.xml',
            'data/texts/new.xml'
        ]);

        expect(component.files.length).toBe(1);
        expect(component.files.at(0).getRawValue().original_filename).toBe('data/texts/new.xml');
        expect(snackbar.show).toHaveBeenCalledWith(expect.stringMatching('Skipped 1'), 'info');
    });

    it('should block adding files if existing publications failed to load', () => {
        vi.spyOn(console, 'error').mockReturnValue(undefined);
        publicationService.getPublications.mockReturnValue(throwError(() => new Error('request failed')));
        fixture = TestBed.createComponent(AddPublicationsFromFilesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.selectedFiles(['data/texts/already-added.xml']);

        expect(component.existingFilePathsLoaded).toBe(false);
        expect(component.existingFilePathsLoadFailed).toBe(true);
        expect(component.files.length).toBe(0);
        expect(snackbar.show).toHaveBeenCalledWith('Failed to load existing publications. Please reload before adding publications.', 'error');
    });

    it('should create and link facsimile collections when adding publications with addFacsBoolean enabled', () => {
        component.selectedFiles(['data/texts/new.xml']);
        component.files.at(0).controls.name.setValue('Publication title');
        component.addMsBoolean = true;
        component.addFacsBoolean = true;
        publicationService.addPublication.mockReturnValue(of(publicationResponse({
            id: 42,
            name: 'Publication title',
            original_filename: 'data/texts/new.xml'
        })));
        publicationService.linkTextToPublication.mockReturnValue(of(linkTextResponse()));
        facsimileService.addFacsimileCollection.mockReturnValue(of(facsimileCollectionResponse(77)));
        publicationService.linkFacsimileToPublication.mockReturnValue(of(linkFacsimileResponse()));

        component.addPublication(component.files.at(0), 1).subscribe();

        expect(publicationService.linkTextToPublication).toHaveBeenCalledWith(42, {
            text_type: 'manuscript',
            original_filename: 'data/texts/new.xml',
            name: 'Publication title',
            published: Published.PublishedInternally,
            language: null,
            sort_order: 1
        }, 'test-project');
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
    });

    it('renders metadata form updates and clears the loading state after completion', async () => {
        const metadata$ = new Subject<XmlMetadata>();
        publicationService.getMetadataFromXML.mockReturnValue(metadata$);
        publicationService.getPublicationCollections.mockReturnValue(of([{
            collection_intro_filename: null,
            collection_intro_published: Published.NotPublished,
            collection_title_filename: '',
            collection_title_published: Published.NotPublished,
            date_created: '',
            date_modified: null,
            id: 1,
            name: 'Collection',
            name_translation_id: null,
            project_id: 1,
            published: Published.PublishedInternally,
            title: 'Collection'
        }]));
        fixture = TestBed.createComponent(AddPublicationsFromFilesComponent);
        component = fixture.componentInstance;
        component.existingFilePathsLoaded = true;
        component.selectedFiles(['document.xml']);
        fixture.detectChanges();
        await fixture.whenStable();
        const metadataButton = Array.from(
            fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
        ).find(button => button.textContent?.includes('Get metadata from XML'));

        expect(metadataButton).toBeDefined();
        metadataButton?.click();
        await fixture.whenStable();

        expect(metadataButton?.disabled).toBe(true);
        expect(fixture.nativeElement.querySelector('loading-spinner')).not.toBeNull();

        metadata$.next({
            genre: 'Novel',
            language: 'sv',
            name: 'Updated title',
            original_publication_date: '1900'
        });
        await fixture.whenStable();

        const renderedInputValues = Array.from(
            fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>
        ).map(input => input.value);
        expect(renderedInputValues).toContain('Updated title');
        expect(metadataButton?.disabled).toBe(false);
        expect(fixture.nativeElement.querySelector('loading-spinner')).toBeNull();
    });

  describe('metadata request throttling', () => {
    const metadata: XmlMetadata = {
      genre: 'Novel',
      language: 'sv',
      name: 'XML title',
      original_publication_date: '1900'
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockReturnValue(undefined);
    });

    it('waits for a response and the inter-request delay before starting the next file', async () => {
      const firstResponse$ = new Subject<XmlMetadata>();
      const secondResponse$ = new Subject<XmlMetadata>();
      publicationService.getMetadataFromXML
        .mockReturnValueOnce(firstResponse$)
        .mockReturnValueOnce(secondResponse$);
      component.selectedFiles(['first.xml', 'second.xml']);
      component.files.at(0).controls.name.setValue('User title');

      component.getMetadataFromXMLAll();
      component.getMetadataFromXMLAll();
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledExactlyOnceWith('first.xml', 'test-project');

      await vi.advanceTimersByTimeAsync(1000);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);

      firstResponse$.next(metadata);
      expect(firstResponse$.observed).toBe(false);
      expect(component.files.at(0).controls.name.value).toBe('User title');
      expect(component.files.at(0).controls.language.value).toBe('sv');
      component.getMetadataFromXMLAll();
      await vi.advanceTimersByTimeAsync(149);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      expect(component.gettingMetadata()).toBe(true);
      expect(snackbar.show).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.getMetadataFromXML).toHaveBeenNthCalledWith(2, 'second.xml', 'test-project');

      secondResponse$.next(metadata);
      expect(component.files.at(1).controls.name.value).toBe('XML title');
      expect(component.gettingMetadata()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledWith('Successfully fetched metadata from all files.');
    });

    it('pauses for one second after every ten attempts, including failed requests', async () => {
      const paths = Array.from({ length: 21 }, (_, index) => `document-${index + 1}.xml`);
      component.selectedFiles(paths);
      publicationService.getMetadataFromXML.mockImplementation(path => path === paths[9]
        ? throwError(() => new Error('request failed'))
        : of(metadata)
      );

      component.getMetadataFromXMLAll();
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1350);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(10);
      expect(component.metadataFailures).toEqual([expect.stringContaining('document-10.xml')]);

      await vi.advanceTimersByTimeAsync(999);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(10);
      expect(component.gettingMetadata()).toBe(true);
      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(11);

      await vi.advanceTimersByTimeAsync(1350);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(20);
      await vi.advanceTimersByTimeAsync(999);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(20);
      await vi.advanceTimersByTimeAsync(1);

      expect(publicationService.getMetadataFromXML.mock.calls.map(([path]) => path)).toEqual(paths);
      expect(component.gettingMetadata()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledWith(expect.stringContaining('document-10.xml'), 'warning');
    });

    it.each([0, 408, 429, 500, 502, 503, 504])('pauses for five seconds after HTTP status %s and resumes normal pacing after success', async status => {
      component.selectedFiles(['failed.xml', 'second.xml', 'third.xml']);
      publicationService.getMetadataFromXML
        .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status })))
        .mockReturnValue(of(metadata));

      component.getMetadataFromXMLAll();
      await vi.advanceTimersByTimeAsync(4999);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      expect(component.gettingMetadata()).toBe(true);

      await vi.advanceTimersByTimeAsync(1);
      expect(publicationService.getMetadataFromXML).toHaveBeenNthCalledWith(2, 'second.xml', 'test-project');
      await vi.advanceTimersByTimeAsync(149);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);

      expect(publicationService.getMetadataFromXML).toHaveBeenNthCalledWith(3, 'third.xml', 'test-project');
      expect(component.gettingMetadata()).toBe(false);
      expect(component.metadataFailures).toEqual([expect.stringContaining('failed.xml')]);
      expect(snackbar.show).toHaveBeenCalledWith(expect.stringContaining('failed.xml'), 'warning');
    });

    it.each([400, 401, 403, 404, 422, 501, 505])('keeps normal pacing after non-transient HTTP status %s', async status => {
      component.selectedFiles(['failed.xml', 'second.xml']);
      publicationService.getMetadataFromXML
        .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status })))
        .mockReturnValue(of(metadata));

      component.getMetadataFromXMLAll();
      await vi.advanceTimersByTimeAsync(149);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(2);
      expect(component.gettingMetadata()).toBe(false);
    });

    it.each([
      { retryAfter: '12', expectedDelayMs: 12000 },
      { retryAfter: 'Fri, 06 Nov 2026 10:00:15 GMT', expectedDelayMs: 15000 },
      { retryAfter: '1', expectedDelayMs: 5000 },
      { retryAfter: 'Fri, 06 Nov 2026 09:00:00 GMT', expectedDelayMs: 5000 },
      { retryAfter: 'invalid', expectedDelayMs: 5000 },
      { retryAfter: '', expectedDelayMs: 5000 }
    ])('uses the longer of five seconds and Retry-After "$retryAfter"', async ({ retryAfter, expectedDelayMs }) => {
      vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
      component.selectedFiles(['failed.xml', 'second.xml']);
      publicationService.getMetadataFromXML
        .mockReturnValueOnce(throwError(() => new HttpErrorResponse({
          status: 503,
          headers: new HttpHeaders({ 'Retry-After': retryAfter })
        })))
        .mockReturnValue(of(metadata));

      component.getMetadataFromXMLAll();
      await vi.advanceTimersByTimeAsync(expectedDelayMs - 1);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(2);
      expect(component.gettingMetadata()).toBe(false);
    });

    it('uses the failure pause instead of adding it to the batch pause', async () => {
      const paths = Array.from({ length: 11 }, (_, index) => `document-${index + 1}.xml`);
      component.selectedFiles(paths);
      publicationService.getMetadataFromXML.mockImplementation(path => path === paths[9]
        ? throwError(() => new HttpErrorResponse({ status: 429 }))
        : of(metadata)
      );

      component.getMetadataFromXMLAll();
      await vi.advanceTimersByTimeAsync(1350);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(10);
      await vi.advanceTimersByTimeAsync(4999);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(10);
      await vi.advanceTimersByTimeAsync(1);

      expect(publicationService.getMetadataFromXML).toHaveBeenNthCalledWith(11, paths[10], 'test-project');
      expect(component.gettingMetadata()).toBe(false);
    });

    it('finishes immediately after a failed final request', () => {
      component.selectedFiles(['failed.xml']);
      publicationService.getMetadataFromXML.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));

      component.getMetadataFromXMLAll();

      expect(component.gettingMetadata()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledWith('Failed to fetch metadata from all files.', 'error');
    });

    it('finishes immediately after the last response when the batch contains exactly ten files', async () => {
      component.selectedFiles(Array.from({ length: 10 }, (_, index) => `document-${index + 1}.xml`));
      publicationService.getMetadataFromXML.mockReturnValue(of(metadata));

      component.getMetadataFromXMLAll();
      await vi.advanceTimersByTimeAsync(1350);

      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(10);
      expect(component.gettingMetadata()).toBe(false);
      expect(snackbar.show).toHaveBeenCalledWith('Successfully fetched metadata from all files.');
    });

    it.each(['request', 'pause', 'failure pause'])('cancels remaining metadata work when destroyed during a %s', async phase => {
      const response$ = new Subject<XmlMetadata>();
      component.selectedFiles(['first.xml', 'second.xml']);
      publicationService.getMetadataFromXML.mockReturnValue(response$);
      component.getMetadataFromXMLAll();
      if (phase === 'pause') {
        response$.next(metadata);
      } else if (phase === 'failure pause') {
        response$.error(new HttpErrorResponse({ status: 503 }));
      }

      fixture.destroy();
      await vi.runAllTimersAsync();

      expect(response$.observed).toBe(false);
      expect(publicationService.getMetadataFromXML).toHaveBeenCalledTimes(1);
      expect(component.gettingMetadata()).toBe(false);
      expect(snackbar.show).not.toHaveBeenCalled();
    });
  });
});

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

function publicationResponse(values: Partial<Publication>): PublicationResponse {
    return {
        success: true,
        message: '',
        data: publication(values)
    };
}

function linkTextResponse(): LinkTextToPublicationResponse {
    return {
        success: true,
        message: '',
        data: {
            date_created: '',
            date_modified: null,
            date_published_externally: null,
            deleted: Deleted.NotDeleted,
            id: 1,
            legacy_id: null,
            name: 'Publication title',
            original_filename: 'data/texts/new.xml',
            publication_id: 42,
            published: Published.PublishedInternally,
            published_by: null,
            section_id: 0,
            sort_order: 1,
            type: 0
        }
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
