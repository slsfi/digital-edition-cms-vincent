/* eslint-disable  @typescript-eslint/no-explicit-any */
import { XmlMetadata } from './../../models/publication';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Column, PublishedOptions } from '../../models/common';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { TranslationsComponent } from '../translations/translations.component';
import { personTypeOptions } from '../../models/person';
import { MatIconModule } from '@angular/material/icon';
import { FileTreeComponent } from "../file-tree/file-tree.component";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PublicationService } from '../../services/publication.service';

export interface EditDialogData<T> {
  model: T | null;
  columns: Column[];
  title: string;
  tableName?: string;
}

@Component({
  selector: 'edit-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, CustomDatePipe, TranslationsComponent, MatIconModule, FileTreeComponent, MatSlideToggleModule
  ],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './edit-dialog.component.html',
  styleUrl: './edit-dialog.component.scss'
})
export class EditDialogComponent<T> implements OnInit {

  constructor(private publicationService: PublicationService) { }

  readonly data = inject<EditDialogData<T>>(MAT_DIALOG_DATA);

  form!: FormGroup;

  columns: Column[] = [];
  personTypes = personTypeOptions;
  publishedOptions = PublishedOptions;

  fieldForTranslate: string | null = null;
  translationIdd: number | undefined;
  parentTranslationField: string | undefined;
  fileSelectorVisible = false;

  get originalFilenameControl() {
    return this.form.controls['original_filename'];
  }

  get showMetadataButton() {
    return this.data.title != 'Comments'
  }

  get model() {
    return this.data.model as T | null;
  }

  get modelId() {
    return (this.model as any)?.id;
  }

  get originalText() {
    return this.model ? (this.model as any).original_text : '';
  }

  ngOnInit() {
    const copiedColumns = this.data.columns
      .map((column: Column) => ({ ...column }))
      .filter((column: Column) => column.type !== 'action' && column.type !== 'index')
      .sort((a: Column, b: Column) => b.editable ? 1 : a.editable ? -1 : 0)
      .sort((a: Column, b: Column) => a.editable && !b.editable ? -1 : 0);
    copiedColumns.forEach((column: Column) => {
      const value = this.model != null ? this.model[column.field as keyof T] as string | number | null : null;
      if (column.type === 'date' && this.isBCDate(value)) {
        column.type = 'string';
      }
    });
    this.columns = copiedColumns;

    this.form = new FormGroup({});

    this.columns.forEach((column) => {
      let value: any = this.model ? this.model[column.field as keyof T] : '';

      const validators = [];
      if (column.required) {
        validators.push(Validators.required);
      }

      if (column.type === 'date' && value != null && typeof value != 'boolean') {
        value = value === '' ? null : new Date(value);
      }

      if (column.field === 'cascade_published') {
        value = false;
      }

      if (column.field === 'published' && !this.modelId) {
        value = 1;
      }

      if (column.type === 'type' && !this.modelId) {
        value = 2;
      }

      this.form.addControl(
        column.field,
        new FormControl({ value, disabled: !column.editable }, { validators })
      );
    });
  }

  isBCDate(dateString: string | number | null) {
    if (dateString == null) {
      return false;
    }
    if (typeof dateString === 'number') {
      return dateString < 0;
    }
    return dateString.includes('BC');
  }

  showTranslations(column: Column) {
    this.fieldForTranslate = column.field;
    this.parentTranslationField = column.parentTranslationField;
    if (this.model) {
      this.translationIdd = this.model[(column.parentTranslationField as keyof T) ?? 'translation_id'] as number;
    }

  }

  showFileSelector() {
    this.fileSelectorVisible = true;
  }

  hideFileSelector() {
    this.fileSelectorVisible = false;
  }

  fileSelected(filename: string) {
    this.fileSelectorVisible = false;
    this.originalFilenameControl.setValue(filename);
  }

  getMetadata() {
    this.publicationService.getMetadataFromXML(this.originalFilenameControl.value)
      .subscribe(metadata => {
        for (const key in metadata) {
          if (Object.prototype.hasOwnProperty.call(metadata, key)) {
            const control = this.form.controls[key];
            const value = metadata[key as keyof XmlMetadata];
            if (control && !!value && !this.form.value[key]) {
              control.setValue(value);
            }
          }
        }
      });

  }

}
