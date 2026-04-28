import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { FacsimileCollectionComponent } from './facsimile-collection.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { Deleted } from '../../models/common.model';
import { FacsimileCollection, FacsimileCollectionEditRequest } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('FacsimileCollectionComponent', () => {
  let component: FacsimileCollectionComponent;
  let fixture: ComponentFixture<FacsimileCollectionComponent>;
  let facsimileService: jasmine.SpyObj<FacsimileService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  const facsimileCollection: FacsimileCollection = {
    date_created: '2024-01-01T00:00:00',
    date_modified: null,
    deleted: Deleted.NotDeleted,
    description: 'Original description',
    external_url: 'https://example.com/facsimile',
    folder_path: null,
    id: 1,
    number_of_pages: 4,
    page_comment: null,
    start_page_number: 1,
    title: 'Original title'
  };

  beforeEach(async () => {
    facsimileService = jasmine.createSpyObj<FacsimileService>(
      'FacsimileService',
      ['getFacsimileCollection', 'verifyFacsimileFile', 'editFacsimileCollection']
    );
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['show']);

    facsimileService.getFacsimileCollection.and.returnValue(of(facsimileCollection));
    facsimileService.verifyFacsimileFile.and.returnValue(of({
      success: true,
      message: '',
      data: { missing_file_numbers: [] }
    }));
    facsimileService.editFacsimileCollection.and.callFake((collectionId, payload) => of({
      success: true,
      message: '',
      data: {
        ...facsimileCollection,
        ...payload,
        id: collectionId
      }
    }));

    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionComponent],
      providers: [
        ...getCommonTestingProviders(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: '1' },
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        },
        {
          provide: ProjectService,
          useValue: {
            getCurrentProject: () => 'test-project'
          }
        },
        {
          provide: FacsimileService,
          useValue: facsimileService
        },
        {
          provide: SnackbarService,
          useValue: snackbar
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable save only when a valid title or number of pages changes', () => {
    let saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();

    component.numberOfPagesControl.setValue(0);
    fixture.detectChanges();

    saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();

    component.numberOfPagesControl.setValue(5);
    fixture.detectChanges();

    saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBeFalse();

    component.numberOfPagesControl.setValue(facsimileCollection.number_of_pages);
    fixture.detectChanges();

    saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();

    component.titleControl.setValue('Updated title');
    fixture.detectChanges();

    saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBeFalse();

    component.titleControl.setValue(' ');
    fixture.detectChanges();

    saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();
  });

  it('should update title and number_of_pages in the edit request', () => {
    const payload: FacsimileCollectionEditRequest = {
      title: 'Updated title',
      number_of_pages: 6,
      start_page_number: facsimileCollection.start_page_number,
      description: facsimileCollection.description,
      external_url: facsimileCollection.external_url,
      deleted: facsimileCollection.deleted
    };

    component.titleControl.setValue('Updated title');
    component.numberOfPagesControl.setValue(6);
    component.saveFacsimileCollection(facsimileCollection);

    expect(facsimileService.editFacsimileCollection).toHaveBeenCalledOnceWith(
      facsimileCollection.id,
      payload,
      'test-project'
    );
    expect(component.numberOfPages()).toBe(6);
    expect(component.facsimileCollection()?.title).toBe('Updated title');
    expect(snackbar.show).toHaveBeenCalledWith('Facsimile collection saved.');
  });
});
