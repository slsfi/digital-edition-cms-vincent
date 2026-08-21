import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let uploadEvents$: Subject<unknown>;

  beforeEach(async () => {
    uploadEvents$ = new Subject<unknown>();

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [
        {
          provide: FacsimileService,
          useValue: { uploadFacsimileFile: () => uploadEvents$ }
        },
        {
          provide: ProjectService,
          useValue: { getCurrentProject: () => 'test-project' }
        },
        {
          provide: SnackbarService,
          useValue: { show: () => undefined }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    fixture.componentRef.setInput('collectionId', 1);
    fixture.componentRef.setInput('numberOfPages', 10);
    fixture.componentRef.setInput('missingFileNumbers', []);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the progress bar as successful when the upload response arrives', () => {
    component.addToQueue(new File(['image'], 'page.jpg', { type: 'image/jpeg' }), 1);
    fixture.detectChanges();

    component.uploadFiles();
    uploadEvents$.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar') as HTMLElement;
    expect(progressBar.classList.contains('progress')).toBe(true);

    uploadEvents$.next(new HttpResponse({ status: 201 }));
    fixture.detectChanges();

    expect(progressBar.classList.contains('progress')).toBe(false);
    expect(progressBar.classList.contains('success')).toBe(true);
  });
});
