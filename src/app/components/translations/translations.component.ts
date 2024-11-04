import { Component, EventEmitter, input, Output, signal } from '@angular/core';
import { BehaviorSubject, filter, Observable, switchMap, tap } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslationService } from '../../services/translation.service';
import { Person } from '../../models/person';
import { languageOptions, nameForLanguage, Translation, TranslationRequestPost } from '../../models/translation';

@Component({
  selector: 'field-translations',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './translations.component.html',
  styleUrl: './translations.component.scss'
})
export class TranslationsComponent {
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  field = input.required<string>();
  data = input.required<Person>();
  parentTranslationField = input<string>();

  mode = signal<'edit' | 'add' | ''>('');

  fieldTranslations$: Observable<Translation[]> = new Observable<Translation[]>();
  translationLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  languages = languageOptions;
  filteredLanguages = languageOptions;
  languageNames = nameForLanguage;

  form!: FormGroup;

  constructor(private translationService: TranslationService) { }

  get originalText() {
    return this.data()[this.field() as keyof Person];
  }

  ngAfterViewInit() {
    const translationId = this.data().translation_id as number;
    const requestData: TranslationRequestPost = {
      table_name: 'subject',
      field_name: this.field(),
    }
    this.fieldTranslations$ = this.translationLoader$.asObservable().pipe(
      filter(() => translationId != null),
      switchMap(() => this.translationService.getTranslations(translationId, requestData)),
      tap((translations) => {
        const activeLanguages = translations.map(t => t.language);
        this.filteredLanguages = languageOptions.filter(l => !activeLanguages.includes(l.value));
      })
    )
    this.form = new FormGroup({
      table_name: new FormControl({ value: 'subject', disabled: true }),
      field_name: new FormControl({ value: this.field(), disabled: true }),
      text: new FormControl('', Validators.required),
      language: new FormControl('', Validators.required),
      translation_id: new FormControl({ value: this.data().translation_id, disabled: true }),
      parent_id: new FormControl({ value: this.data().id, disabled: true }),
      neutral_text: new FormControl({ value: this.data()[this.field() as keyof Person], disabled: true }),
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

  onSubmitTranslation(event: Event) {
    event.preventDefault();
    const data = this.form.getRawValue()
    let req;
    if (this.mode() === 'edit') {
      const translationId = this.data().translation_id as number;
      req = this.translationService.editTranslation(translationId, data)
    } else {
      req = this.translationService.addTranslation(data)
    }
    req.subscribe(() => {
      this.translationLoader$.next(0);
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
    })
  }

  previous() {
    if (this.mode() !== '') {
      this.mode.set('');
    } else {
      this.close.emit();
    }
  }

}
