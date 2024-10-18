import { Component, EventEmitter, input, Output, signal } from '@angular/core';
import { languageOptions, nameForLanguage, Person, Translation, TranslationRequestPost } from '../../models/person';
import { ProjectService } from '../../services/project.service';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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

  mode = signal<'edit' | 'add' | ''>('');

  fieldTranslations$: Observable<Translation[]> = new Observable<Translation[]>();
  translationLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  languages = languageOptions;
  filteredLanguages = languageOptions;
  languageNames = nameForLanguage;

  form!: FormGroup;

  constructor(private projectService: ProjectService) { }

  get originalText() {
    return this.data()[this.field() as keyof Person];
  }

  ngOnInit() {
    const translationId = this.data().translation_id as number;
    const requestData: TranslationRequestPost = {
      table_name: 'subject',
      field_name: this.field(),
    }
    this.fieldTranslations$ = this.translationLoader$.asObservable().pipe(
      switchMap(() => this.projectService.getTranslations(translationId, requestData)),
      tap((translations) => {
        const activeLanguages = translations.map(t => t.language);
        this.filteredLanguages = languageOptions.filter(l => !activeLanguages.includes(l.value));
      })
    )

    this.projectService.getTranslations(translationId, requestData);

    this.form = new FormGroup({
      table_name: new FormControl({ value: 'subject', disabled: true }),
      field_name: new FormControl({ value: this.field(), disabled: true }),
      text: new FormControl('', Validators.required),
      language: new FormControl('', Validators.required),
      translation_id: new FormControl({ value: this.data().translation_id, disabled: true }),
      parent_id: new FormControl({ value: this.data().id, disabled: true }),
      neutral_text: new FormControl({ value: this.data()[this.field() as keyof Person], disabled: true }),
      deleted: new FormControl({ value: 0, disabled: true }),
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
    const translationId = this.data().translation_id as number;
    if (this.mode() === 'edit') {
      this.projectService.editTranslation(translationId, data).subscribe(() => {});
    } else {
      this.projectService.addTranslation(data).subscribe(() => {});
    }
    this.translationLoader$.next(0);
    this.mode.set('');
  }

  editTranslation(translation: Translation) {
    this.mode.set('edit');
    this.form.setValue({
      table_name: 'subject',
      field_name: this.field(),
      text: translation.text,
      language: translation.language,
      neutral_text: this.data()[this.field() as keyof Person],
      translation_id: translation.translation_id,
      parent_id: this.data().id,
      deleted: 0
    })
    this.deleted.enable();
    this.language.disable();
  }

  addTranslation() {
    this.mode.set('add');
    this.form.reset();
    this.deleted.disable();
    this.language.enable();
  }

  previous() {
    if (this.mode() !== '') {
      this.mode.set('');
    } else {
      this.close.emit();
    }
  }

}
