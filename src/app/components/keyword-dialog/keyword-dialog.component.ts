import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, take } from 'rxjs';

import { Keyword, KeywordCreationRequest, KeywordUpdateRequest } from '../../models/keyword.model';

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
  templateUrl: './keyword-dialog.component.html',
  styleUrl: './keyword-dialog.component.scss'
})
export class KeywordDialogComponent {
  form!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<KeywordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KeywordDialogData
  ) {
    // Always create form immediately to prevent template errors
    let initialCategory = data.keyword?.category || '';
    this.createForm(initialCategory);
    
    // For new keywords, update the category if we can get the first available one
    if (data.mode === 'add' && !initialCategory) {
      data.categories$.pipe(take(1)).subscribe(categories => {
        if (categories && categories.length > 0) {
          this.form.patchValue({ category: categories[0] });
        }
      });
    }
  }

  private createForm(initialCategory: string) {
    this.form = this.fb.group({
      text: [this.data.keyword?.name || '', Validators.required],
      category: [initialCategory],
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
          name: formValue.text,
          category: formValue.category || null,
          projectId: 1, // Mock project ID for now
          translations: []
        };
        this.dialogRef.close(request);
      } else {
        const request: KeywordUpdateRequest = {
          id: this.data.keyword!.id,
          name: formValue.text,
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
