import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { FileUploadComponent } from './file-upload.component';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let uploadEvents$: Subject<unknown>;
  let uploadFacsimileFile: ReturnType<typeof vi.fn>;
  let snackbar: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    uploadEvents$ = new Subject<unknown>();
    uploadFacsimileFile = vi.fn().mockReturnValue(uploadEvents$);
    snackbar = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [
        {
          provide: FacsimileService,
          useValue: { uploadFacsimileFile }
        },
        {
          provide: ProjectService,
          useValue: { getCurrentProject: () => 'test-project' }
        },
        { provide: SnackbarService, useValue: snackbar }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    fixture.componentRef.setInput('collectionId', 1);
    fixture.componentRef.setInput('numberOfPages', 10);
    fixture.componentRef.setInput('missingFileNumbers', []);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders intermediate progress and successful completion without a forced refresh', async () => {
    await queueFile();
    clickButton('Upload');
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
    expect(snackbar.show).toHaveBeenCalledWith('All files uploaded.');
  });

  it('renders the terminal error state without a forced refresh', async () => {
    const filesUploaded = vi.spyOn(component.filesUploaded, 'emit');
    await queueFile();
    clickButton('Upload');
    await fixture.whenStable();

    uploadEvents$.next({ type: HttpEventType.UploadProgress, loaded: 4, total: 10 });
    await fixture.whenStable();
    uploadEvents$.error(new Error('upload failed'));
    await fixture.whenStable();

    expect(progressBar().classList.contains('error')).toBe(true);
    expect(progressBar().getAttribute('aria-valuenow')).toBe('0');
    expect(statusIcon('error')?.textContent).toContain('error');
    expect(component.uploadInProgress()).toBe(false);
    expect(component.uploadFinished()).toBe(true);
    expect(filesUploaded).not.toHaveBeenCalled();
    expect(button('Retry')?.disabled).toBe(false);
    expect(snackbar.show).toHaveBeenCalledWith(
      'Upload finished with errors. You can retry failed files.',
      'warning'
    );
  });

  it('cancels an upload and renders the reset pending state', async () => {
    await queueFile();
    clickButton('Upload');
    await fixture.whenStable();

    uploadEvents$.next({ type: HttpEventType.UploadProgress, loaded: 7, total: 10 });
    await fixture.whenStable();
    clickButton('Cancel');
    await fixture.whenStable();

    expect(progressBar().classList.contains('pending')).toBe(true);
    expect(progressBar().getAttribute('aria-valuenow')).toBe('0');
    expect(statusIcon('pending')?.textContent).toContain('circle');
    expect(component.uploadInProgress()).toBe(false);
    expect(component.uploadFinished()).toBe(false);
    expect(button('Upload')?.disabled).toBe(false);
    expect(button('Cancel')?.disabled).toBe(true);
  });

  it('retries only failed files and emits completion after every file succeeds', async () => {
    const successfulUpload$ = new Subject<unknown>();
    const failedUpload$ = new Subject<unknown>();
    const retryUpload$ = new Subject<unknown>();
    uploadFacsimileFile
      .mockReturnValueOnce(successfulUpload$)
      .mockReturnValueOnce(failedUpload$)
      .mockReturnValueOnce(retryUpload$);
    const filesUploaded = vi.spyOn(component.filesUploaded, 'emit');
    await queueFile('page-1.jpg', 1);
    await queueFile('page-2.jpg', 2);

    clickButton('Upload');
    await fixture.whenStable();
    successfulUpload$.next(new HttpResponse({ status: 201 }));
    failedUpload$.error(new Error('upload failed'));
    await fixture.whenStable();

    expect(progressBars()[0].classList.contains('success')).toBe(true);
    expect(progressBars()[1].classList.contains('error')).toBe(true);
    expect(filesUploaded).not.toHaveBeenCalled();
    expect(button('Retry')?.disabled).toBe(false);

    clickButton('Retry');
    await fixture.whenStable();

    expect(uploadFacsimileFile).toHaveBeenCalledTimes(3);
    expect(button('Retry')).toBeUndefined();
    expect(button('Upload')?.disabled).toBe(true);
    button('Upload')?.click();
    expect(uploadFacsimileFile).toHaveBeenCalledTimes(3);

    retryUpload$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();

    expect(progressBars().every(bar => bar.classList.contains('success'))).toBe(true);
    expect(filesUploaded).toHaveBeenCalledTimes(1);
    expect(snackbar.show).toHaveBeenLastCalledWith('All files uploaded.');
  });

  it('preserves completed files when cancelling and resumes only unfinished files', async () => {
    const successfulUpload$ = new Subject<unknown>();
    const activeUpload$ = new Subject<unknown>();
    const resumedUpload$ = new Subject<unknown>();
    uploadFacsimileFile
      .mockReturnValueOnce(successfulUpload$)
      .mockReturnValueOnce(activeUpload$)
      .mockReturnValueOnce(resumedUpload$);
    await queueFile('page-1.jpg', 1);
    await queueFile('page-2.jpg', 2);

    clickButton('Upload');
    await fixture.whenStable();
    successfulUpload$.next(new HttpResponse({ status: 201 }));
    activeUpload$.next({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    await fixture.whenStable();
    clickButton('Cancel');
    await fixture.whenStable();

    expect(progressBars()[0].classList.contains('success')).toBe(true);
    expect(progressBars()[1].classList.contains('pending')).toBe(true);
    expect(progressBars()[1].getAttribute('aria-valuenow')).toBe('0');
    expect(button('Upload')?.disabled).toBe(false);

    activeUpload$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();
    expect(progressBars()[1].classList.contains('pending')).toBe(true);

    clickButton('Upload');
    await fixture.whenStable();
    expect(uploadFacsimileFile).toHaveBeenCalledTimes(3);

    resumedUpload$.next(new HttpResponse({ status: 201 }));
    await fixture.whenStable();

    expect(progressBars().every(bar => bar.classList.contains('success'))).toBe(true);
  });

  async function queueFile(name = 'page.jpg', order = 1): Promise<void> {
    component.addToQueue(new File(['image'], name, { type: 'image/jpeg' }), order);
    await fixture.whenStable();
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
