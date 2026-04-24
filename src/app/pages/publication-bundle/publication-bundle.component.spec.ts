import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PublicationBundleComponent } from './publication-bundle.component';
import { Published } from '../../models/common.model';
import { Publication } from '../../models/publication.model';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('PublicationBundleComponent', () => {
  let component: PublicationBundleComponent;
  let fixture: ComponentFixture<PublicationBundleComponent>;
  let publicationService: jasmine.SpyObj<PublicationService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    publicationService = jasmine.createSpyObj<PublicationService>(
      'PublicationService',
      ['getPublicationCollections', 'getPublications', 'addPublication', 'linkTextToPublication']
    );
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', ['getCurrentProject']);
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['show']);

    projectService.getCurrentProject.and.returnValue('test-project');
    publicationService.getPublicationCollections.and.returnValue(of([]));
    publicationService.getPublications.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PublicationBundleComponent],
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
        { provide: PublicationService, useValue: publicationService },
        { provide: SnackbarService, useValue: snackbar }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationBundleComponent);
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
    fixture = TestBed.createComponent(PublicationBundleComponent);
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
    fixture = TestBed.createComponent(PublicationBundleComponent);
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
});

function publication(values: Partial<Publication>): Publication {
  return {
    date_created: '',
    date_modified: null,
    deleted: 0,
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
