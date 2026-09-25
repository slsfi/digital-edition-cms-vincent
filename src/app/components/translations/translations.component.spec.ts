import type { MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { TranslationsComponent } from './translations.component';
import { languageOptions, LanguageCode } from '../../models/language.model';
import { Translation, TranslationResponse } from '../../models/translation.model';
import { ProjectService } from '../../services/project.service';
import { TranslationService } from '../../services/translation.service';

describe('TranslationsComponent', () => {
  let component: TranslationsComponent;
  let fixture: ComponentFixture<TranslationsComponent>;
  let translationService: MockedObject<Pick<TranslationService,
    'getTranslations' | 'addTranslation' | 'editTranslation'>>;

  beforeEach(async () => {
    translationService = {
      getTranslations: vi.fn().mockName('TranslationService.getTranslations'),
      addTranslation: vi.fn().mockName('TranslationService.addTranslation'),
      editTranslation: vi.fn().mockName('TranslationService.editTranslation')
    };
    translationService.getTranslations.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TranslationsComponent],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            getCurrentProject: () => 'test-project'
          }
        },
        {
          provide: TranslationService,
          useValue: translationService
        }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should keep all languages available when there is no translation id yet', () => {
    createComponent();

    expect(translationService.getTranslations).not.toHaveBeenCalled();
    expect(component.filteredLanguages).toEqual([...languageOptions]);
  });

  it('should normalize a string translation id before loading translations', () => {
    createComponent({ translationIdd: '42' });

    expect(component.translationId).toBe(42);
    expect(translationService.getTranslations).toHaveBeenCalledWith(42, {
      table_name: 'publication_collection',
      field_name: 'name'
    }, 'test-project');
  });

  it('renders translations from a delayed initial load without a forced refresh', async () => {
    const translations$ = new Subject<Translation[]>();
    translationService.getTranslations.mockReturnValue(translations$);
    createComponent({ translationIdd: 42 });

    translations$.next([translation('sv', 'Hej')]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.edit-translations')?.textContent)
      .toContain('Hej');
  });

  it('refreshes rendered translations after adding one', async () => {
    const refreshedTranslations$ = new Subject<Translation[]>();
    const addResponse$ = new Subject<TranslationResponse>();
    translationService.getTranslations
      .mockReturnValueOnce(of([]))
      .mockReturnValueOnce(refreshedTranslations$);
    translationService.addTranslation.mockReturnValue(addResponse$);
    createComponent({ translationIdd: 42 });

    clickButton('Add translation');
    await fixture.whenStable();
    component.form.patchValue({ language: 'fr', text: 'Bonjour' });
    submitForm();

    expect(translationService.addTranslation).toHaveBeenCalled();

    addResponse$.next(translationResponse(translation('fr', 'Bonjour')));
    refreshedTranslations$.next([translation('fr', 'Bonjour')]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.edit-translations')?.textContent)
      .toContain('Bonjour');
  });

  it('refreshes rendered translations after editing one', async () => {
    const initialTranslations$ = new Subject<Translation[]>();
    const refreshedTranslations$ = new Subject<Translation[]>();
    const editResponse$ = new Subject<TranslationResponse>();
    translationService.getTranslations
      .mockReturnValueOnce(initialTranslations$)
      .mockReturnValueOnce(refreshedTranslations$);
    translationService.editTranslation.mockReturnValue(editResponse$);
    createComponent({ translationIdd: 42 });

    initialTranslations$.next([translation('sv', 'Hej')]);
    await fixture.whenStable();
    clickButton('Edit');
    await fixture.whenStable();
    component.form.patchValue({ text: 'Uppdaterad' });
    submitForm();

    expect(translationService.editTranslation).toHaveBeenCalled();

    editResponse$.next(translationResponse(translation('sv', 'Uppdaterad')));
    refreshedTranslations$.next([translation('sv', 'Uppdaterad')]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.edit-translations')?.textContent)
      .toContain('Uppdaterad');
  });

  function createComponent(inputs?: {
    field?: string;
    tableName?: string;
    translationIdd?: number | string;
    originalText?: string;
    parentId?: number;
    parentTranslationField?: string;
  }): void {
    fixture = TestBed.createComponent(TranslationsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('field', inputs?.field ?? 'name');
    fixture.componentRef.setInput('tableName', inputs?.tableName ?? 'publication_collection');

    if (inputs?.translationIdd !== undefined) {
      fixture.componentRef.setInput('translationIdd', inputs.translationIdd);
    }
    if (inputs?.originalText !== undefined) {
      fixture.componentRef.setInput('originalText', inputs.originalText);
    }
    if (inputs?.parentId !== undefined) {
      fixture.componentRef.setInput('parentId', inputs.parentId);
    }
    if (inputs?.parentTranslationField !== undefined) {
      fixture.componentRef.setInput('parentTranslationField', inputs.parentTranslationField);
    }

    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const button = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(candidate => candidate.textContent?.includes(label));

    expect(button).toBeDefined();
    button?.click();
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

function translation(language: LanguageCode, text: string): Translation {
  return {
    field_name: 'name',
    language,
    table_name: 'publication_collection',
    text,
    translation_id: 42,
    translation_text_id: 7
  };
}

function translationResponse(data: Translation): TranslationResponse {
  return {
    success: true,
    message: '',
    data
  };
}
