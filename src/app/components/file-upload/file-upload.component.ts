import { Component, EventEmitter, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BehaviorSubject, from, mergeMap, Observable, Subscription } from 'rxjs';
import { HttpEventType, HttpHeaderResponse, HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { FacsimileService } from '../../services/facsimile.service';

enum FileQueueStatus {
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
  Progress = 'progress'
}

class FileQueueObject {
  file: File;
  order: number;
  status: FileQueueStatus;
  progress: number = 0;
  request: Subscription | undefined;
  response: HttpResponse<any> | undefined;

  constructor(file: File, order: number) {
    this.file = file;
    this.order = order;
    this.status = FileQueueStatus.Pending;
  }

  isUploadable = () => this.status === FileQueueStatus.Pending || this.status === FileQueueStatus.Error;
}

@Component({
  selector: 'file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule, MatButtonModule, MatTableModule, LoadingSpinnerComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {

  @Output() filesUploaded: EventEmitter<void> = new EventEmitter<void>();

  collectionId = input.required<number>();
  numberOfPages = input.required<number>();
  missingFileNumbers = input.required<number[]>();

  constructor(private facsimileService: FacsimileService, private snackbar: MatSnackBar) { }

  _queue: FileQueueObject[] = [];
  uploadQueue$: BehaviorSubject<FileQueueObject[]> = new BehaviorSubject<FileQueueObject[]>([]);
  file: File | undefined;
  uploadInProgress = false;
  allUploaded = false;

  onFileSelected(event: Event) {
    if (event.target) {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length) {
        if (target.files.length !== this.missingFileNumbers().length) {
          this.snackbar.open(`Number of files must match with missing images (${this.missingFileNumbers().length})`, 'Close', { panelClass: 'snackbar-warning' });
          return;
        }
        const files = target.files;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const number = this.missingFileNumbers()[i];
          this.addToQueue(file, number);
        }
      }
    }
  }

  addToQueue(file: File, order: number) {
    const queueObject = new FileQueueObject(file, order);
    this._queue.push(queueObject);
    this.uploadQueue$.next(this._queue);
  }

  uploadFiles() {
    const files = this._queue.filter(file => file.isUploadable());
    const concurrentRequests = 3;

    const throttledFiles$ = from(files).pipe(
      mergeMap((fileObj, index) =>
        this.uploadFile(fileObj), concurrentRequests
      )
    );

    this.uploadInProgress = true;

    throttledFiles$.subscribe({
      next: () => {},
      error: err => this.snackbar.open('Error uploading file', 'Close', { panelClass: 'snackbar-error' }),
      complete: () => {
        this.uploadInProgress = false;
        this.allUploaded = true;
        this.filesUploaded.emit();
        this.snackbar.open('All files uploaded', 'Close', { panelClass: 'snackbar-success' });

      },
    });
  }

  uploadFile(queueObject: FileQueueObject) {
    return new Observable(observer => {
      const file = queueObject.file
      const formData = new FormData();
      formData.append('facsimile', file, file.name);

      queueObject.request = this.facsimileService.uploadFacsimileFile(this.collectionId(), queueObject.order, formData)
        .subscribe({
          next: event => {
            if (event.type == HttpEventType.UploadProgress) {
              queueObject.progress = Math.round(100 * (event.loaded / event.total));
              queueObject.status = FileQueueStatus.Progress;
            }
            if (event instanceof HttpHeaderResponse) {
              const statusString = event.status.toString()
              if (statusString.startsWith("2")) {
                queueObject.status = FileQueueStatus.Success;
                observer.next();
                observer.complete();
              }
            }
          },
          error: error => {
            queueObject.status = FileQueueStatus.Error;
            queueObject.progress = 0;
            // Continue with next file
            observer.next();
            observer.complete();
          },
          complete: () => {
            observer.next();
            observer.complete();
          }
        });
    })
  }

  cancelUploads() {
    this._queue.forEach(file => {
      if (file.request) {
        file.request.unsubscribe();
        file.status = FileQueueStatus.Pending;
        file.progress = 0;
      }
    });
    this.uploadInProgress = false;
  }

  clearQueue() {
    this._queue = [];
    this.uploadQueue$.next([]);
  }

}
