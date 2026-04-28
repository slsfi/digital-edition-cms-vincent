import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AddPublicationsFromFilesComponent } from './add-publications-from-files.component';
import { Deleted, Published } from '../../models/common.model';
import { FacsimileCollectionResponse, LinkFacsimileToPublicationResponse } from '../../models/facsimile.model';
import { LinkTextToPublicationResponse, Publication, PublicationResponse } from '../../models/publication.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('AddPublicationsFromFilesComponent', () => {
  let component: AddPublicationsFromFilesComponent;
  let fixture: ComponentFixture<AddPublicationsFromFilesComponent>;
  let facsimileService: jasmine.SpyObj<FacsimileService>;
  let publicationService: jasmine.SpyObj<PublicationService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    facsimileService = jasmine.createSpyObj<FacsimileService>('FacsimileService', ['addFacsimileCollection']);
    publicationService = jasmine.createSpyObj<PublicationService>(
      'PublicationService',
      [
        'getPublicationCollections',
        'getPublications',
        'addPublication',
        'linkFacsimileToPublication',
        'linkTextToPublication'
      ]
    );
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', ['getCurrentProject']);
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['show']);

    projectService.getCurrentProject.and.returnValue('test-project');
    publicationService.getPublicationCollections.and.returnValue(of([]));
    publicationService.getPublications.and.returnValue(of([]));

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trim existing publication file paths before duplicate checks', () => {
    spyOn(console, 'log');
    publicationService.getPublications.and.returnValue(of([
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
    expect(snackbar.show).toHaveBeenCalledWith(jasmine.stringMatching('Skipped 1'), 'info');
  });

  it('should block adding files if existing publications failed to load', () => {
    spyOn(console, 'error');
    publicationService.getPublications.and.returnValue(throwError(() => new Error('request failed')));
    fixture = TestBed.createComponent(AddPublicationsFromFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectedFiles(['data/texts/already-added.xml']);

    expect(component.existingFilePathsLoaded).toBeFalse();
    expect(component.existingFilePathsLoadFailed).toBeTrue();
    expect(component.files.length).toBe(0);
    expect(snackbar.show).toHaveBeenCalledWith(
      'Failed to load existing publications. Please reload before adding publications.',
      'error'
    );
  });

  it('should create and link facsimile collections when adding publications with addFacsBoolean enabled', () => {
    component.selectedFiles(['data/texts/new.xml']);
    component.files.at(0).controls.name.setValue('Publication title');
    component.addMsBoolean = true;
    component.addFacsBoolean = true;
    publicationService.addPublication.and.returnValue(of(publicationResponse({
      id: 42,
      name: 'Publication title',
      original_filename: 'data/texts/new.xml'
    })));
    publicationService.linkTextToPublication.and.returnValue(of(linkTextResponse()));
    facsimileService.addFacsimileCollection.and.returnValue(of(facsimileCollectionResponse(77)));
    publicationService.linkFacsimileToPublication.and.returnValue(of(linkFacsimileResponse()));

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
