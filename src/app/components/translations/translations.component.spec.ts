import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { languageOptions } from '../../models/language.model';
import { ProjectService } from '../../services/project.service';
import { TranslationService } from '../../services/translation.service';
import { TranslationsComponent } from './translations.component';

describe('TranslationsComponent', () => {
  let component: TranslationsComponent;
  let fixture: ComponentFixture<TranslationsComponent>;
  let translationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    translationService = jasmine.createSpyObj<TranslationService>('TranslationService', ['getTranslations', 'addTranslation', 'editTranslation']);
    translationService.getTranslations.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TranslationsComponent],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            getCurrentProject: () => 'test-project',
          }
        },
        {
          provide: TranslationService,
          useValue: translationService,
        }
      ]
    }).compileComponents();
  });

  function createComponent(inputs?: {
    field?: string;
    tableName?: string;
    translationIdd?: number | string;
    originalText?: string;
    parentId?: number;
    parentTranslationField?: string;
  }) {
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
      field_name: 'name',
    }, 'test-project');
  });
});
