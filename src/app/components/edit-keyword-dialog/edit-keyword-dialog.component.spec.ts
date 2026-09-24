import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { getCommonTestingProviders } from '../../../testing/test-providers';
import {
  EditKeywordDialogComponent,
  EditKeywordDialogData
} from './edit-keyword-dialog.component';

describe('EditKeywordDialogComponent', () => {
  let component: EditKeywordDialogComponent;
  let fixture: ComponentFixture<EditKeywordDialogComponent>;
  let categories$: Subject<string[]>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    categories$ = new Subject<string[]>();
    dialogRef = { close: vi.fn() };

    const dialogData: EditKeywordDialogData = {
      mode: 'add',
      keyword: {
        id: 0,
        name: 'New keyword',
        category: null,
        translations: []
      },
      categories$: categories$.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [EditKeywordDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditKeywordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('renders asynchronous categories and submits the initialized category', async () => {
    categories$.next(['Letters', 'People']);
    await fixture.whenStable();

    const categorySelect = fixture.debugElement
      .query(By.directive(MatSelect))
      .componentInstance as MatSelect;

    expect(categorySelect.options.map(option => option.viewValue)).toEqual([
      'No category',
      'Letters',
      'People'
    ]);
    expect(categorySelect.value).toBe('Letters');
    expect(component.form.controls.category.value).toBe('Letters');

    const submitButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.trim() === 'Add');

    expect(submitButton).toBeDefined();
    submitButton?.click();
    await fixture.whenStable();

    expect(dialogRef.close).toHaveBeenCalledWith({
      name: 'New keyword',
      category: 'Letters',
      translations: []
    });
  });
});
