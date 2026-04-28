import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, take } from 'rxjs';

import { FileTreeComponent } from "../file-tree/file-tree.component";
import { TranslationsComponent } from '../translations/translations.component';
import { Column, PublishedOptions } from '../../models/common.model';
import { GenericLanguageObj, languageOptionsWithNone } from '../../models/language.model';
import { personTypeOptions } from '../../models/person.model';
import { XmlMetadata } from './../../models/publication.model';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';

type LanguageOptionsByField = Partial<Record<string, readonly GenericLanguageObj[]>>;

export interface EditDialogData<T> {
  model: T | null;
  columns: Column[];
  title: string;
  tableName?: string;
}

@Component({
  selector: 'edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    FileTreeComponent,
    TranslationsComponent,
  ],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './edit-dialog.component.html',
  styleUrl: './edit-dialog.component.scss'
})
export class EditDialogComponent<T> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private publicationService = inject(PublicationService);
  private projectService = inject(ProjectService);

  readonly data = inject<EditDialogData<T>>(MAT_DIALOG_DATA);

  form!: FormGroup;

  columns: Column[] = [];
  readonly languageOptions: readonly GenericLanguageObj[] = languageOptionsWithNone;
  private readonly languageValues = signal<Record<string, string | null>>({});
  readonly languageOptionsByField = computed(() => {
    const optionsByField: LanguageOptionsByField = {};

    for (const [field, value] of Object.entries(this.languageValues())) {
      optionsByField[field] = this.buildLanguageOptions(value);
    }

    return optionsByField;
  });
  personTypes = personTypeOptions;
  publishedOptions = PublishedOptions;

  fieldForTranslate: string | null = null;
  translationIdd: number | undefined;
  parentTranslationField: string | undefined;
  fileSelectorVisible = false;
  gettingMetadata = false;

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
    if (this.model) {
      return this.getProperty<T, keyof T>(this.model, 'id' as keyof T) as number;
    }
    return;
  }

  get originalText() {
    if (this.model && this.fieldForTranslate) {
      return this.getProperty<T, keyof T>(this.model, this.fieldForTranslate as keyof T) as string;
    }
    return;
  }

  getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
    return obj[key];
  }

  ngOnInit() {
    const copiedColumns = this.data.columns.map(
      (column: Column) => ({ ...column })
    ).filter(
      (column: Column) => column.type !== 'action' && column.type !== 'index'
    ).sort((a, b) => {
      // sort columns first by editable and then by editOrder
      if (a.editable && !b.editable) {
        return -1;
      }
      if (!a.editable && b.editable) {
        return 1;
      }
      return (a.editOrder ?? 99) - (b.editOrder ?? 99); // default to 99 if editOrder is not set
    });

    copiedColumns.forEach((column: Column) => {
      const value = this.model != null ? this.model[column.field as keyof T] as string | number | null : null;
      if (column.type === 'date' && this.isBCDate(value)) {
        column.type = 'string';
      }
    });

    this.columns = copiedColumns;
    this.form = new FormGroup({});

    this.columns.forEach((column) => {
      let value = this.model ? this.getProperty<T, keyof T>(this.model, column.field as keyof T) : '';

      const validators = [];
      if (column.required) {
        validators.push(Validators.required);
      }

      // convert date string to Date object
      if (column.type === 'date' && value != null && typeof value != 'boolean') {
        value = ((value === '' ? null : new Date(value as string)) as T[keyof T]);
      }

      // Language selects use null for "None", while backend values may be
      // empty strings, known language codes, or legacy/unknown codes.
      if (column.type === 'language') {
        value = this.normalizeLanguageValue(value) as T[keyof T];
      }

      // set link_manuscript and link_facsimile to false by default
      if (column.field === 'link_manuscript' || column.field === 'link_facsimile') {
        value = false as T[keyof T];
      }

      // set cascade_published to false by default
      if (column.field === 'cascade_published') {
        value = false as T[keyof T];
      }

      // set published to 1 by default for new records
      if (column.field === 'published' && !this.modelId) {
        value = 1 as T[keyof T];
      }

      // set sort_order to 1 by default for new manuscripts and variants
      if (column.field === 'sort_order' && !this.modelId) {
        value = 1 as T[keyof T];
      }

      // set start_page_number to 0 by default for new facsimile collections
      if (column.field === 'start_page_number' && !this.modelId) {
        value = 0 as T[keyof T];
      }

      // set type to 2 by default for new records
      if (column.type === 'type' && !this.modelId) {
        value = '2' as T[keyof T];
      }

      this.form.addControl(
        column.field,
        new FormControl({ value, disabled: !column.editable }, { validators })
      );

      // Keep languageOptionsByField in sync so unknown codes can be shown as
      // temporary select options instead of being dropped from the form value.
      if (column.type === 'language') {
        const control = this.form.controls[column.field];
        this.setLanguageValue(column.field, control.value);
        control.valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(controlValue => this.setLanguageValue(column.field, controlValue));
      }
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
    this.gettingMetadata = true;
    const currentProject = this.projectService.getCurrentProject();
    this.publicationService.getMetadataFromXML(this.originalFilenameControl.value, currentProject).pipe(
      take(1),
      finalize(() => {
        this.gettingMetadata = false;
      })
    ).subscribe((metadata: XmlMetadata) => {
      for (const key in metadata) {
        if (Object.prototype.hasOwnProperty.call(metadata, key)) {
          const control = this.form.controls[key];
          const value = metadata[key as keyof XmlMetadata];
          if (control && !!value) {
            control.setValue(value);
          }
        }
      }
    });
  }

  /**
   * Stores the current value for one language field so the computed
   * option map can react when the form control changes.
   */
  private setLanguageValue(field: string, value: unknown): void {
    const normalizedValue = this.normalizeLanguageValue(value);
    this.languageValues.update(values => ({
      ...values,
      [field]: normalizedValue
    }));
  }

  /**
   * Normalizes empty language control values to null while preserving
   * non-empty backend codes, including codes not listed in languageOptions.
   */
  private normalizeLanguageValue(value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return String(value);
  }

  /**
   * Builds the select options for a language field. Known or empty values use
   * the shared language list; unknown backend codes get a temporary first
   * option so saving the dialog without edits does not discard that code.
   */
  private buildLanguageOptions(value: string | null): readonly GenericLanguageObj[] {
    if (!value || this.isKnownLanguageCode(value)) {
      return this.languageOptions;
    }

    return [
      { label: `Unknown language (${value})`, code: value },
      ...this.languageOptions,
    ];
  }

  /**
   * Checks whether a language code exists in the shared language model list.
   */
  private isKnownLanguageCode(value: string): boolean {
    return this.languageOptions.some(option => option.code === value);
  }

}
