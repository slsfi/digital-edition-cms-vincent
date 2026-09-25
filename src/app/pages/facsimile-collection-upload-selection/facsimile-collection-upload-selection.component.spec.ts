import type { MockedObject } from 'vitest';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { FacsimileCollectionUploadSelectionComponent } from './facsimile-collection-upload-selection.component';
import { Deleted } from '../../models/common.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('FacsimileCollectionUploadSelectionComponent', () => {
  let component: FacsimileCollectionUploadSelectionComponent;
  let fixture: ComponentFixture<FacsimileCollectionUploadSelectionComponent>;
  let facsimileService: MockedObject<Pick<FacsimileService,
    'getFacsimileCollection' | 'uploadFacsimileFile'>>;
  let uploadEvents$: Subject<unknown>;
  let snackbar: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    uploadEvents$ = new Subject<unknown>();
    snackbar = { show: vi.fn() };
    facsimileService = {
      getFacsimileCollection: vi.fn().mockReturnValue(of({
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
      })),
      uploadFacsimileFile: vi.fn().mockReturnValue(uploadEvents$)
    };

    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionUploadSelectionComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 12 } } }
        },
        { provide: FacsimileService, useValue: facsimileService },
        { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
        { provide: SnackbarService, useValue: snackbar }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionUploadSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders intermediate progress and successful completion without a forced refresh', async () => {
    startUpload();
    await fixture.whenStable();

    uploadEvents$.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    await fixture.whenStable();

    expect(progressBar().classList.contains('progress')).toBe(true);
    expect(progressBar().getAttribute('aria-valuenow')).toBe('50');
    expect(statusIcon('progress')?.textContent).toContain('arrow_upload_progress');

    uploadEvents$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();

    expect(progressBar().classList.contains('success')).toBe(true);
    expect(progressBar().getAttribute('aria-valuenow')).toBe('100');
    expect(statusIcon('success')?.textContent).toContain('check_circle');
    expect(component.uploadInProgress()).toBe(false);
    expect(component.uploadFinished()).toBe(true);
    expect(component.showCompletedNavigation()).toBe(true);
    expect(fixture.nativeElement.querySelector('.completed-back-nav')).not.toBeNull();
  });

  it('renders an error and successfully retries the failed upload', async () => {
    const failedUpload$ = new Subject<unknown>();
    const retryUpload$ = new Subject<unknown>();
    facsimileService.uploadFacsimileFile
      .mockReturnValueOnce(failedUpload$)
      .mockReturnValueOnce(retryUpload$);
    startUpload();
    await fixture.whenStable();

    failedUpload$.error(new Error('upload failed'));
    await fixture.whenStable();

    expect(progressBar().classList.contains('error')).toBe(true);
    expect(progressBar().getAttribute('aria-valuenow')).toBe('0');
    expect(statusIcon('error')?.textContent).toContain('error');
    expect(component.uploadFinished()).toBe(true);
    expect(button('Retry failed uploads')).toBeDefined();

    clickButton('Retry failed uploads');
    await fixture.whenStable();
    expect(component.uploadFinished()).toBe(false);
    expect(button('Retry failed uploads')).toBeUndefined();
    expect(button('Resume uploads')).toBeUndefined();
    retryUpload$.next({ type: HttpEventType.UploadProgress, loaded: 8, total: 10 });
    await fixture.whenStable();
    retryUpload$.next(new HttpResponse({ status: 204 }));
    await fixture.whenStable();

    expect(progressBar().classList.contains('success')).toBe(true);
    expect(progressBar().getAttribute('aria-valuenow')).toBe('100');
    expect(statusIcon('success')?.textContent).toContain('check_circle');
    expect(component.uploadInProgress()).toBe(false);
    expect(component.uploadFinished()).toBe(true);
    expect(component.showCompletedNavigation()).toBe(true);
  });

  it('preserves completed files when cancelling and resumes only unfinished files', async () => {
    const successfulUpload$ = new Subject<unknown>();
    const activeUpload$ = new Subject<unknown>();
    const resumedUpload$ = new Subject<unknown>();
    facsimileService.uploadFacsimileFile
      .mockReturnValueOnce(successfulUpload$)
      .mockReturnValueOnce(activeUpload$)
      .mockReturnValueOnce(resumedUpload$);
    component.rows.at(0).patchValue({
      slot: 1,
      file: new File(['image'], 'replacement-1.jpg', { type: 'image/jpeg' })
    });
    component.addRow();
    component.rows.at(1).patchValue({
      slot: 2,
      file: new File(['image'], 'replacement-2.jpg', { type: 'image/jpeg' })
    });
    component.upload();
    await fixture.whenStable();
    successfulUpload$.next(new HttpResponse({ status: 201 }));
    activeUpload$.next({ type: HttpEventType.UploadProgress, loaded: 7, total: 10 });
    await fixture.whenStable();

    clickButton('Cancel uploads');
    await fixture.whenStable();

    expect(progressBars()[0].classList.contains('success')).toBe(true);
    expect(progressBars()[1].classList.contains('pending')).toBe(true);
    expect(progressBars()[1].getAttribute('aria-valuenow')).toBe('0');
    expect(component.uploadInProgress()).toBe(false);
    expect(component.uploadFinished()).toBe(false);
    expect(button('Cancel uploads')?.disabled).toBe(true);
    expect(button('Resume uploads')?.disabled).toBe(false);

    activeUpload$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();
    expect(progressBars()[1].classList.contains('pending')).toBe(true);
    expect(component.showCompletedNavigation()).toBe(false);

    clickButton('Resume uploads');
    await fixture.whenStable();
    expect(facsimileService.uploadFacsimileFile).toHaveBeenCalledTimes(3);

    resumedUpload$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();

    expect(progressBars().every(bar => bar.classList.contains('success'))).toBe(true);
    expect(component.showCompletedNavigation()).toBe(true);
  });

  function startUpload(): void {
    component.rows.at(0).patchValue({
      slot: 2,
      file: new File(['image'], 'replacement.jpg', { type: 'image/jpeg' })
    });
    component.upload();
  }

  function clickButton(label: string): void {
    const target = button(label);
    expect(target).toBeDefined();
    target?.click();
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(candidate => candidate.textContent?.includes(label));
  }

  function progressBar(): HTMLElement {
    return fixture.nativeElement.querySelector('mat-progress-bar') as HTMLElement;
  }

  function progressBars(): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('mat-progress-bar') as NodeListOf<HTMLElement>
    );
  }

  function statusIcon(status: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`mat-icon.${status}`);
  }
});
