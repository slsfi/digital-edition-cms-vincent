import { CommonModule } from '@angular/common';
import { HttpEventType, HttpHeaderResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, from, mergeMap, Observable, Subscription } from 'rxjs';

import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

export interface ReplaceFacsimileImagesDialogData {
  collectionId: number;
  numberOfPages: number;
}

type Replacement = { slot: number; file: File };

enum FileQueueStatus {
  Pending = 'pending',
  Success = 'success',
  Error = 'error',
  Progress = 'progress'
}

class FileQueueObject {
  file: File;
  order: number;
  status: FileQueueStatus = FileQueueStatus.Pending;
  progress = 0;
  request?: Subscription;

  constructor(file: File, order: number) {
    this.file = file;
    this.order = order;
  }

  isUploadable = () => this.status === FileQueueStatus.Pending || this.status === FileQueueStatus.Error;
}

type ReplaceRowForm = FormGroup<{
  slot: FormControl<number | null>;
  file: FormControl<File | null>;
}>;

@Component({
  selector: 'replace-facsimile-images-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressBarModule,
  ],
  templateUrl: './replace-facsimile-images-dialog.component.html',
  styleUrl: './replace-facsimile-images-dialog.component.scss'
})
export class ReplaceFacsimileImagesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ReplaceFacsimileImagesDialogComponent>);
  private readonly data = inject<ReplaceFacsimileImagesDialogData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly facsimileService = inject(FacsimileService);
  private readonly projectService = inject(ProjectService);
  private readonly snackbar = inject(SnackbarService);

  readonly form = this.fb.group({
    rows: this.fb.array<ReplaceRowForm>([])
  });

  // Upload queue UI (copied in spirit from FileUploadComponent)
  private _queue: FileQueueObject[] = [];
  uploadQueue$ = new BehaviorSubject<FileQueueObject[]>([]);
  uploadInProgress = false;
  allUploaded = false;

  get rows(): FormArray<ReplaceRowForm> {
    return this.form.controls.rows;
  }

  get numberOfPages(): number {
    return this.data.numberOfPages;
  }

  constructor() {
    // start with one row
    this.addRow();
  }

  addRow(): void {
    const row: ReplaceRowForm = this.fb.group({
      slot: this.fb.control<number | null>(null, {
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(this.data.numberOfPages),
        ],
      }),
      file: this.fb.control<File | null>(null, { validators: [Validators.required] }),
    });

    this.rows.push(row);
  }

  removeRow(index: number): void {
    this.rows.removeAt(index);
  }

  selectFile(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.rows.at(index).get('file')!.setValue(file);
    // allow re-selecting the same file later
    input.value = '';
  }

  fileNameAt(index: number): string {
    const f = this.rows.at(index).get('file')!.value as File | null;
    return f?.name ?? '';
  }

  // Validation helpers
  get hasDuplicateSlots(): boolean {
    const slots = this.rows.controls
      .map(c => c.get('slot')!.value)
      .filter((v): v is number => typeof v === 'number');

    return new Set(slots).size !== slots.length;
  }

  get hasOutOfRangeSlots(): boolean {
    const slots = this.rows.controls
      .map(c => c.get('slot')!.value)
      .filter((v): v is number => typeof v === 'number');

    return slots.some(s => s < 1 || s > this.data.numberOfPages);
  }

  get hasErrors(): boolean {
    return this._queue.some(q => q.status === FileQueueStatus.Error);
  }

  buildReplacements(): Replacement[] {
    const reps: Replacement[] = [];
    for (const c of this.rows.controls) {
      const slot = c.get('slot')!.value as number | null;
      const file = c.get('file')!.value as File | null;
      if (slot && file) reps.push({ slot, file });
    }
    return reps;
  }

  // Turn replacements into upload queue
  prepareQueue(): void {
    this._queue = [];
    const replacements = this.buildReplacements()
      // stable order helps users read progress
      .sort((a, b) => a.slot - b.slot);

    for (const r of replacements) {
      this._queue.push(new FileQueueObject(r.file, r.slot));
    }
    this.uploadQueue$.next(this._queue);
    this.allUploaded = false;
  }

  upload(): void {
    if (this.form.invalid) return;

    if (this.hasDuplicateSlots) {
      this.snackbar.show('Each page number can only be used once.', 'warning');
      return;
    }
    if (this.hasOutOfRangeSlots) {
      this.snackbar.show(`Page numbers must be between 1 and ${this.data.numberOfPages}.`, 'warning');
      return;
    }

    // Build queue from current form
    this.prepareQueue();

    const files = this._queue.filter(q => q.isUploadable());
    if (!files.length) {
      this.snackbar.show('No files to upload.', 'warning');
      return;
    }

    const concurrentRequests = 3;
    const throttled$ = from(files).pipe(
      mergeMap(q => this.uploadOne(q), concurrentRequests)
    );

    this.uploadInProgress = true;

    throttled$.subscribe({
      error: () => this.snackbar.show('Error uploading file(s).', 'error'),
      complete: () => {
        this.uploadInProgress = false;
        this.allUploaded = true;
        
        const hasErrors = this._queue.some(q => q.status === FileQueueStatus.Error);
        if (hasErrors) {
          this.snackbar.show('Upload finished with errors. You can retry failed files.', 'warning');
        } else {
          this.snackbar.show('Upload finished.');
        }
      }
    });
  }

  private uploadOne(queueObject: FileQueueObject): Observable<void> {
    return new Observable<void>(observer => {
      const formData = new FormData();
      formData.append('facsimile', queueObject.file, queueObject.file.name);

      const currentProject = this.projectService.getCurrentProject();
      queueObject.request = this.facsimileService
        .uploadFacsimileFile(this.data.collectionId, queueObject.order, formData, currentProject)
        .subscribe({
          next: (event: any) => { // eslint-disable-line
            if (event.type === HttpEventType.UploadProgress) {
              queueObject.progress = Math.round(100 * (event.loaded / event.total));
              queueObject.status = FileQueueStatus.Progress;
              this.uploadQueue$.next(this._queue);
            }
            if (event instanceof HttpHeaderResponse) {
              if (String(event.status).startsWith('2')) {
                queueObject.status = FileQueueStatus.Success;
                this.uploadQueue$.next(this._queue);
                observer.next();
                observer.complete();
              }
            }
          },
          error: () => {
            queueObject.status = FileQueueStatus.Error;
            queueObject.progress = 0;
            this.uploadQueue$.next(this._queue);
            // Continue the stream so other uploads proceed
            observer.next();
            observer.complete();
          },
          complete: () => {
            observer.next();
            observer.complete();
          }
        });
    });
  }

  cancelUploads(): void {
    this._queue.forEach(q => {
      if (q.request) {
        q.request.unsubscribe();
        q.status = FileQueueStatus.Pending;
        q.progress = 0;
      }
    });
    this.uploadQueue$.next(this._queue);
    this.uploadInProgress = false;
  }

  closeAndRefresh(): void {
    this.dialogRef.close({ uploaded: true });
  }

}
