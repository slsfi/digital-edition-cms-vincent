import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Column } from '../../models/common.model';
import { EditDialogComponent, EditDialogData } from './edit-dialog.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

// Simple interface for testing
interface TestData {
  id?: number;
  name?: string;
  language?: string | null;
}

describe('EditDialogComponent', () => {
  let component: EditDialogComponent<TestData>;
  let fixture: ComponentFixture<EditDialogComponent<TestData>>;
  let dialogData: EditDialogData<TestData>;

  const languageColumn: Column = {
    field: 'language',
    header: 'Language',
    type: 'language',
    editable: true,
  };

  beforeEach(async () => {
    dialogData = {
      model: null,
      columns: [],
      title: 'Test'
    };

    await TestBed.configureTestingModule({
      imports: [EditDialogComponent],
      providers: [
        ...getCommonTestingProviders(),
        {
          provide: MAT_DIALOG_DATA,
          useFactory: () => dialogData
        }
      ]
    })
    .compileComponents();
  });

  function createComponent(data: Partial<EditDialogData<TestData>> = {}) {
    dialogData = {
      model: data.model ?? null,
      columns: data.columns ?? [],
      title: data.title ?? 'Test',
      tableName: data.tableName
    };
    fixture = TestBed.createComponent(EditDialogComponent<TestData>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function languageOptionsFor(field: string) {
    return component.languageOptionsByField()[field] ?? component.languageOptions;
  }

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should render language fields as select controls', () => {
    createComponent({
      model: { language: 'en' },
      columns: [languageColumn]
    });

    expect(component.form.controls['language'].value).toBe('en');
    expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[formcontrolname="language"]')).toBeNull();
  });

  it('should expose language options for language fields', () => {
    createComponent({
      model: { language: 'en' },
      columns: [languageColumn]
    });

    const options = languageOptionsFor('language');

    expect(options.some(option => option.code === 'en' && option.label === 'English')).toBeTrue();
    expect(options.some(option => option.label.startsWith('Unknown language'))).toBeFalse();
  });

  it('should preserve unknown backend language codes as selectable options', () => {
    createComponent({
      model: { language: 'zz' },
      columns: [languageColumn]
    });

    const options = languageOptionsFor('language');

    expect(component.form.controls['language'].value).toBe('zz');
    expect(options[0]).toEqual({ label: 'Unknown language (zz)', code: 'zz' });
  });

  it('should normalize empty language values to none', () => {
    createComponent({
      columns: [languageColumn]
    });

    const options = languageOptionsFor('language');

    expect(component.form.controls['language'].value).toBeNull();
    expect(options[0]).toEqual({ label: 'None', code: null });
  });

  it('should update unknown language options when the control value changes', () => {
    createComponent({
      model: { language: 'en' },
      columns: [languageColumn]
    });

    component.form.controls['language'].setValue('zz');

    const options = languageOptionsFor('language');
    expect(options[0]).toEqual({ label: 'Unknown language (zz)', code: 'zz' });
  });
});
