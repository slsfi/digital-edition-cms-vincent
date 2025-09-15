import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

import { Keyword, KeywordCreationRequest, KeywordUpdateRequest } from '../../models/keyword';

export interface KeywordDialogData {
  mode: 'add' | 'edit';
  keyword?: Keyword;
  categories$: Observable<string[]>;
}

@Component({
  selector: 'app-keyword-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'add' ? 'Add New Keyword' : 'Edit Keyword' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Keyword Text</mat-label>
            <input matInput formControlName="text" required>
            <mat-error *ngIf="form.get('text')?.hasError('required')">
              Keyword text is required
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <mat-option value="">No category</mat-option>
              <mat-option *ngFor="let category of data.categories$ | async" [value]="category">
                {{ category }}
              </mat-option>
            </mat-select>
            <mat-hint>Select existing category or leave empty for no category</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New Category (optional)</mat-label>
            <input matInput formControlName="newCategory" placeholder="Type to add new category">
            <mat-hint>Leave empty to use existing category above</mat-hint>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!form.valid || isSubmitting">
          {{ data.mode === 'add' ? 'Add' : 'Update' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-row {
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
    }
    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class KeywordDialogComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<KeywordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KeywordDialogData
  ) {
    this.form = this.fb.group({
      text: [data.keyword?.text || '', Validators.required],
      category: [data.keyword?.category || ''],
      newCategory: ['']
    });

    // Handle new category input
    this.form.get('newCategory')?.valueChanges.subscribe(value => {
      if (value && value.trim()) {
        this.form.patchValue({ category: value.trim() });
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.isSubmitting = true;
      const formValue = this.form.value;
      
      if (this.data.mode === 'add') {
        const request: KeywordCreationRequest = {
          text: formValue.text,
          category: formValue.category || null,
          projectId: 1, // Mock project ID for now
          translations: []
        };
        this.dialogRef.close(request);
      } else {
        const request: KeywordUpdateRequest = {
          id: this.data.keyword!.id,
          text: formValue.text,
          category: formValue.category || null,
          translations: []
        };
        this.dialogRef.close(request);
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
