import { HttpEventType, HttpResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { FacsimileCollectionUploadBlockComponent } from './facsimile-collection-upload-block.component';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { Deleted } from '../../models/common.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('FacsimileCollectionUploadBlockComponent', () => {
  let component: FacsimileCollectionUploadBlockComponent;
  let fixture: ComponentFixture<FacsimileCollectionUploadBlockComponent>;
  let routeData$: Subject<{ mode: 'missing' | 'all' }>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    routeData$ = new Subject<{ mode: 'missing' | 'all' }>();

    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionUploadBlockComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: 12 } },
            data: routeData$
          }
        },
        {
          provide: FacsimileService,
          useValue: {
            getFacsimileCollection: () => of(facsimileCollection()),
            verifyFacsimileFile: () => of({
              success: true,
              message: '',
              data: { missing_file_numbers: [] }
            })
          }
        },
        { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
        { provide: SnackbarService, useValue: { show: vi.fn() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionUploadBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('renders the upload mode after delayed route data', async () => {
    routeData$.next({ mode: 'all' });
    await fixture.whenStable();

    expect(component.mode()).toBe('all');
    expect(fixture.nativeElement.textContent)
      .toContain('Upload images to all pages in the facsimile collection (4)');
  });
});

describe('FacsimileCollectionUploadBlockComponent upload integration', () => {
  let fixture: ComponentFixture<FacsimileCollectionUploadBlockComponent>;
  let uploadEvents$: Subject<unknown>;

  beforeEach(async () => {
    uploadEvents$ = new Subject<unknown>();

    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionUploadBlockComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: 12 } },
            data: of({ mode: 'all' })
          }
        },
        {
          provide: FacsimileService,
          useValue: {
            getFacsimileCollection: () => of(facsimileCollection()),
            uploadFacsimileFile: () => uploadEvents$
          }
        },
        { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
        { provide: SnackbarService, useValue: { show: vi.fn() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionUploadBlockComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders child upload progress through the default-OnPush host', async () => {
    const fileUpload = fixture.debugElement.query(By.directive(FileUploadComponent))
      .componentInstance as FileUploadComponent;
    fileUpload.addToQueue(new File(['image'], 'page.jpg', { type: 'image/jpeg' }), 1);
    await fixture.whenStable();

    const uploadButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Upload'));
    expect(uploadButton).toBeDefined();
    uploadButton?.click();
    await fixture.whenStable();

    uploadEvents$.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    await fixture.whenStable();

    const progressBar = fixture.nativeElement.querySelector('mat-progress-bar') as HTMLElement;
    expect(progressBar.classList.contains('progress')).toBe(true);
    expect(progressBar.getAttribute('aria-valuenow')).toBe('50');
    expect(fixture.nativeElement.querySelector('mat-icon.progress')?.textContent)
      .toContain('arrow_upload_progress');

    uploadEvents$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();

    expect(progressBar.classList.contains('success')).toBe(true);
    expect(progressBar.getAttribute('aria-valuenow')).toBe('100');
    expect(fixture.nativeElement.querySelector('mat-icon.success')?.textContent)
      .toContain('check_circle');
    expect(fixture.nativeElement.querySelector('.completed-back-nav')?.textContent)
      .toContain('Return to facsimile collection');
  });

  it('does not render completion navigation when a child upload fails', async () => {
    const fileUpload = fixture.debugElement.query(By.directive(FileUploadComponent))
      .componentInstance as FileUploadComponent;
    fileUpload.addToQueue(new File(['image'], 'page.jpg', { type: 'image/jpeg' }), 1);
    await fixture.whenStable();

    const uploadButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Upload'));
    expect(uploadButton).toBeDefined();
    uploadButton?.click();
    await fixture.whenStable();

    uploadEvents$.error(new Error('upload failed'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('mat-icon.error')?.textContent)
      .toContain('error');
    expect(fixture.nativeElement.querySelector('.completed-back-nav')).toBeNull();
    const retryButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Retry'));
    expect(retryButton?.disabled).toBe(false);
  });
});

function facsimileCollection() {
  return {
    date_created: '',
    date_modified: null,
    deleted: Deleted.NotDeleted,
    description: null,
    external_url: null,
    folder_path: null,
    id: 12,
    number_of_pages: 4,
    page_comment: null,
    start_page_number: 0,
    title: 'Facsimile'
  };
}
