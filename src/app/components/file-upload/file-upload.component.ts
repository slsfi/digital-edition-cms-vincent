import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, from, mergeMap, Observable, Subscription } from 'rxjs';

import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

enum FileQueueStatus {
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
  Progress = 'progress'
}

class FileQueueObject {
  file: File;
  order: number;
  readonly status = signal(FileQueueStatus.Pending);
  readonly progress = signal(0);
  request: Subscription | undefined;

  constructor(file: File, order: number) {
    this.file = file;
    this.order = order;
  }

  isUploadable = () => this.status() === FileQueueStatus.Pending || this.status() === FileQueueStatus.Error;
}

@Component({
  selector: 'file-upload',
  imports: [CommonModule, MatIconModule, MatProgressBarModule, MatButtonModule, MatTableModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  private readonly facsimileService = inject(FacsimileService);
  private readonly projectService = inject(ProjectService);
  private readonly snackbar = inject(SnackbarService);

  collectionId = input.required<number>();
  numberOfPages = input.required<number>();
  missingFileNumbers = input.required<number[]>();

  @Output() filesUploaded: EventEmitter<void> = new EventEmitter<void>();

  _queue: FileQueueObject[] = [];
  uploadQueue$: BehaviorSubject<FileQueueObject[]> = new BehaviorSubject<FileQueueObject[]>([]);
  file: File | undefined;
  readonly uploadInProgress = signal(false);
  readonly uploadFinished = signal(false);
  private uploadSubscription: Subscription | undefined;

  get hasErrors(): boolean {
    return this._queue.some(file => file.status() === FileQueueStatus.Error);
  }

  get hasUploadableFiles(): boolean {
    return this._queue.some(file => file.isUploadable());
  }

  onFileSelected(event: Event) {
    if (event.target) {
      const missing = this.missingFileNumbers();
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length) {
        if (target.files.length !== missing.length) {
          this.snackbar.show(`Number of files must match with missing images (${missing.length}).`, 'warning');
          return;
        }
        const files = target.files;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const number = missing[i];
          this.addToQueue(file, number);
        }
      }
    }
  }

  addToQueue(file: File, order: number) {
    const queueObject = new FileQueueObject(file, order);
    this._queue.push(queueObject);
    this.uploadFinished.set(false);
    this.uploadQueue$.next([...this._queue]);
  }

  uploadFiles() {
    const files = this._queue.filter(file => file.isUploadable());
    const concurrentRequests = 3;

    const throttledFiles$ = from(files).pipe(
      mergeMap((fileObj) =>
        this.uploadFile(fileObj), concurrentRequests
      )
    );

    this.uploadFinished.set(false);
    this.uploadInProgress.set(true);

    this.uploadSubscription = throttledFiles$.subscribe({
      error: () => {
        this.uploadInProgress.set(false);
        this.uploadFinished.set(true);
        this.uploadSubscription = undefined;
        this.snackbar.show('Error uploading file.', 'error');
      },
      complete: () => {
        this.uploadInProgress.set(false);
        this.uploadFinished.set(true);
        this.uploadSubscription = undefined;
        if (this.hasErrors) {
          this.snackbar.show('Upload finished with errors. You can retry failed files.', 'warning');
        } else {
          this.filesUploaded.emit();
          this.snackbar.show('All files uploaded.');
        }
      },
    });
  }

  uploadFile(queueObject: FileQueueObject) {
    return new Observable<void>(observer => {
      const file = queueObject.file
      const formData = new FormData();
      formData.append('facsimile', file, file.name);

      const currentProject = this.projectService.getCurrentProject();
      const request = this.facsimileService.uploadFacsimileFile(this.collectionId(), queueObject.order, formData, currentProject)
        .subscribe({
          next: (event: any) => { /* eslint-disable-line */
            if (event.type == HttpEventType.UploadProgress) {
              queueObject.progress.set(Math.round(100 * (event.loaded / event.total)));
              queueObject.status.set(FileQueueStatus.Progress);
            }
            if (event.type === HttpEventType.Response) {
              queueObject.progress.set(100);
              queueObject.status.set(FileQueueStatus.Success);
              observer.next();
              observer.complete();
            }
          },
          error: () => {
            queueObject.status.set(FileQueueStatus.Error);
            queueObject.progress.set(0);
            // Continue with next file
            observer.next();
            observer.complete();
          },
          complete: () => {
            if (!observer.closed) {
              queueObject.status.set(FileQueueStatus.Error);
              queueObject.progress.set(0);
              observer.next();
              observer.complete();
            }
          }
        });
      queueObject.request = request;
      return () => request.unsubscribe();
    })
  }

  cancelUploads() {
    const activeFiles = this._queue.filter(file => file.request && !file.request.closed);
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = undefined;
    activeFiles.forEach(file => {
      file.status.set(FileQueueStatus.Pending);
      file.progress.set(0);
    });
    this.uploadInProgress.set(false);
    this.uploadFinished.set(false);
  }

  clearQueue() {
    this._queue = [];
    this.uploadFinished.set(false);
    this.uploadQueue$.next([]);
  }

}
