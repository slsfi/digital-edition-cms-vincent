import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

import { Keyword, KeywordCreationRequest, KeywordUpdateRequest } from '../../models/keyword.model';


export interface EditKeywordDialogData {
  mode: 'add' | 'edit';
  keyword?: Keyword;
  categories$: Observable<string[]>;
}

type FormValue = {
  name: FormControl<string>;
  category: FormControl<string>;
  newCategory: FormControl<string>;
};

@Component({
  selector: 'edit-keyword-dialog',
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
  templateUrl: './edit-keyword-dialog.component.html',
  styleUrl: './edit-keyword-dialog.component.scss'
})
export class EditKeywordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditKeywordDialogComponent>);
  readonly data = inject<EditKeywordDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group<FormValue>({
    name: this.fb.control(this.data.keyword?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    category: this.fb.control(this.data.keyword?.category ?? '', { nonNullable: true }),
    newCategory: this.fb.control('', { nonNullable: true })
  });

  isSubmitting = signal(false);

  private categoriesSig = toSignal(this.data.categories$, { initialValue: [] as string[] });

  // Set first category as initially selected if available
  private initCategoryOnce = effect(() => {
    if (this.data.mode !== 'add') return;

    const hasValue = !!this.form.controls.category.value?.trim();
    const cats = this.categoriesSig();

    if (!hasValue && cats.length) {
      this.form.patchValue({ category: cats[0] });
    }
  });

  save(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);

    const { name: text, category, newCategory } = this.form.getRawValue();
    const name = text.trim();
    const normalizedCategory = this.normalizeCategory(category, newCategory);

    if (this.data.mode === 'add') {
      const request: KeywordCreationRequest = {
        name,
        category: normalizedCategory,
        translations: []
      };
      this.dialogRef.close(request);
      return;
    }

    // edit
    const request: KeywordUpdateRequest = {
      id: this.data.keyword!.id,
      name,
      category: normalizedCategory,
      translations: []
    };
    this.dialogRef.close(request);
  }

  /**
   * Prefer newCategory (trimmed) if provided; otherwise use existing category.
   * Return null when the resulting value is empty.
   */
  private normalizeCategory(existingCategory: string, newCategory: string): string | null {
    const trimmedNew = newCategory.trim();
    if (trimmedNew) return trimmedNew;

    const trimmedExisting = (existingCategory ?? '').trim();
    return trimmedExisting ? trimmedExisting : null;
  }

}
