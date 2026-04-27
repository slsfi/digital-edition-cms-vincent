import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { PublicationsComponent } from './publications.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { Deleted, Published } from '../../models/common.model';
import { FacsimileCollectionResponse, LinkFacsimileToPublicationResponse } from '../../models/facsimile.model';
import { Publication, PublicationResponse } from '../../models/publication.model';
import { FacsimileService } from '../../services/facsimile.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { QueryParamsService } from '../../services/query-params.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('PublicationsComponent', () => {
  let component: PublicationsComponent;
  let fixture: ComponentFixture<PublicationsComponent>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let facsimileService: jasmine.SpyObj<FacsimileService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let publicationService: jasmine.SpyObj<PublicationService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    facsimileService = jasmine.createSpyObj<FacsimileService>('FacsimileService', ['addFacsimileCollection']);
    projectService = jasmine.createSpyObj<ProjectService>('ProjectService', ['getCurrentProject']);
    publicationService = jasmine.createSpyObj<PublicationService>('PublicationService', [
      'addPublication',
      'editPublication',
      'getCommentsForPublication',
      'getFacsimilesForPublication',
      'getManuscriptsForPublication',
      'getPublications',
      'getVersionsForPublication',
      'linkFacsimileToPublication',
      'linkTextToPublication'
    ]);
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['show']);

    projectService.getCurrentProject.and.returnValue('test-project');
    publicationService.getPublications.and.returnValue(of([]));
    publicationService.getCommentsForPublication.and.returnValue(of([]));
    publicationService.getFacsimilesForPublication.and.returnValue(of([]));
    publicationService.getManuscriptsForPublication.and.returnValue(of([]));
    publicationService.getVersionsForPublication.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PublicationsComponent],
      providers: [
        ...getCommonTestingProviders(),
        { provide: MatDialog, useValue: dialog },
        { provide: FacsimileService, useValue: facsimileService },
        { provide: ProjectService, useValue: projectService },
        { provide: PublicationService, useValue: publicationService },
        { provide: QueryParamsService, useValue: { sortParams$: of([]), filterParams$: of([]) } },
        { provide: SnackbarService, useValue: snackbar },
        { provide: LoadingService, useValue: { loading$: of(false) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create and link a facsimile collection when adding a publication with link_facsimile enabled', () => {
    dialog.open.and.returnValue({
      afterClosed: () => of({
        form: new FormGroup({
          name: new FormControl('Publication title'),
          published: new FormControl(Published.PublishedInternally),
          link_facsimile: new FormControl(true),
          link_manuscript: new FormControl(false)
        })
      })
    } as never);
    publicationService.addPublication.and.returnValue(of(publicationResponse({
      id: 42,
      name: 'Publication title'
    })));
    facsimileService.addFacsimileCollection.and.returnValue(of(facsimileCollectionResponse(77)));
    publicationService.linkFacsimileToPublication.and.returnValue(of(linkFacsimileResponse()));

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
