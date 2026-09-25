import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';

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
    let snackbar: MockedObject<Pick<SnackbarService, 'show'>>;
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
        snackbar = {
            show: vi.fn().mockName("SnackbarService.show")
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
        await fixture.whenStable();

        expect(component.metadataUpdating()).toBe(true);
        expect(fixture.nativeElement.querySelector('loading-spinner')).not.toBeNull();

        publications$.next([publication({
            id: 42,
            name: 'Old title',
            original_filename: 'document.xml'
        })]);
        metadata$.next({
            genre: 'Novel',
            language: 'sv',
            name: 'Updated title',
            original_publication_date: '1900'
        });
        await fixture.whenStable();

        expect(publicationService.editPublication).toHaveBeenCalledWith(
            42,
            { name: 'Updated title' },
            'test-project'
        );
        expect(component.metadataUpdating()).toBe(false);
        expect(fixture.nativeElement.querySelector('loading-spinner')).toBeNull();
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
