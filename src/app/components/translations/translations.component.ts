import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, filter, Observable, of, switchMap, take, tap } from 'rxjs';

import { languageOptions, LanguageObj } from '../../models/language.model';
import { Translation, TranslationRequestPost, TranslationResponse } from '../../models/translation.model';
import { GetLangLabelPipe } from '../../pipes/get-lang-label.pipe';
import { ProjectService } from '../../services/project.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'field-translations',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    GetLangLabelPipe
  ],
  templateUrl: './translations.component.html',
  styleUrl: './translations.component.scss'
})
export class TranslationsComponent implements AfterViewInit {
  private readonly projectService = inject(ProjectService);
  private readonly translationService = inject(TranslationService);

  field = input.required<string>();
  translationIdd = input<number | undefined>();
  parentId = input<number>();
  originalText = input<string>();
  tableName = input.required<string | undefined>();
  parentTranslationField = input<string>();

  @Output() panelClosed = new EventEmitter<void>();

  mode = signal<'edit' | 'add' | ''>('');

  fieldTranslations$: Observable<Translation[]> = of([]);
  translationLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  languages = languageOptions;
  filteredLanguages: LanguageObj[] = [];

  translationId: number | undefined;

  form!: FormGroup;

  ngAfterViewInit() {
    this.translationId = this.translationIdd();
    const requestData: TranslationRequestPost = {
      table_name: this.tableName() ?? '',
      field_name: this.field(),
    }
    this.fieldTranslations$ = this.translationLoader$.asObservable().pipe(
      filter(() => this.translationId != null),
      switchMap(() => {
        const currentProject = this.projectService.getCurrentProject();
        return this.translationService.getTranslations(this.translationId as number, requestData, currentProject);
      }),
      tap((translations) => {
        const activeLanguages = translations.map(t => t.language);
        this.filteredLanguages = languageOptions.filter(l => !activeLanguages.includes(l.code));
      })
    )
    this.form = new FormGroup({
      table_name: new FormControl({ value: this.tableName(), disabled: true }),
      field_name: new FormControl({ value: this.field(), disabled: true }),
      text: new FormControl('', Validators.required),
      language: new FormControl('', Validators.required),
      translation_id: new FormControl({ value: this.translationId, disabled: true }),
      parent_id: new FormControl({ value: this.parentId(), disabled: true }),
      neutral_text: new FormControl({ value: this.originalText(), disabled: true }),
      translation_text_id: new FormControl({ value: null, disabled: true }),
      deleted: new FormControl({ value: 0, disabled: true }),
      parent_translation_field: new FormControl({ value: this.parentTranslationField(), disabled: true }),
    });
  }

  get deleted() {
    return this.form.get('deleted') as FormControl;
  }

  get language() {
    return this.form.get('language') as FormControl;
  }

  saveTranslation(event: Event) {
    event.preventDefault();
    const data = this.form.getRawValue();

    let request$: Observable<TranslationResponse>;
    const currentProject = this.projectService.getCurrentProject();
    if (this.mode() === 'edit') {
      request$ = this.translationService.editTranslation(this.translationId as number, data, currentProject);
    } else {
      request$ = this.translationService.addTranslation(data, currentProject);
    }
    request$.pipe(take(1)).subscribe({
      next: res => {
        if (this.translationId == null) {
          this.translationId = res.data.translation_id;
        }
        this.translationLoader$.next(0);
      }
    });
    this.mode.set('');
  }

  editTranslation(translation: Translation) {
    this.mode.set('edit');
    this.form.patchValue({
      text: translation.text,
      language: translation.language,
      translation_text_id: translation.translation_text_id,
    })
    this.deleted.enable();
    this.language.disable();
  }

  addTranslation() {
    this.mode.set('add');
    this.deleted.disable();
    this.language.enable();
    this.form.patchValue({
      text: '',
      language: '',
      translation_text_id: null,
      translation_id: this.translationId,
    })
  }

  previous() {
    if (this.mode() !== '') {
      this.mode.set('');
    } else {
      this.panelClosed.emit();
    }
  }

}
