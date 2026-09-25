import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { EditNodeDialogData } from '../../models/table-of-contents.model';
import { SnackbarService } from '../../services/snackbar.service';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { EditNodeDialogComponent } from './edit-node-dialog.component';

describe('EditNodeDialogComponent', () => {
  let component: EditNodeDialogComponent;
  let fixture: ComponentFixture<EditNodeDialogComponent>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  const dialogData: EditNodeDialogData = {
    collectionId: 42,
    dialogMode: 'add',
    publications: [
      {
        id: 1,
        name: 'Alpha publication',
        original_publication_date: '1901-01-01',
        language: 'fi',
        _search: 'alpha publication 1'
      },
      {
        id: 2,
        name: 'Beta publication',
        original_publication_date: '1902-02-02',
        language: 'sv',
        _search: 'beta publication 2'
      }
    ]
  };

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });

    await TestBed.configureTestingModule({
      imports: [EditNodeDialogComponent],
      providers: [
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: SnackbarService, useValue: { show: vi.fn() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditNodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('renders a debounced publication result and updates dependent fields on selection', async () => {
    component.searchControl.setValue('beta');

    await new Promise(resolve => setTimeout(resolve, 350));
    await fixture.whenStable();

    const autocomplete = fixture.debugElement
      .query(By.directive(MatAutocomplete))
      .componentInstance as MatAutocomplete;

    expect(autocomplete.options.map(option => option.value.id)).toEqual([2]);
    expect(autocomplete.options.map(option => option.getLabel())).toEqual([
      'Beta publication (ID: 2)'
    ]);

    autocomplete.optionSelected.emit({
      option: autocomplete.options.first
    } as MatAutocompleteSelectedEvent);
    await fixture.whenStable();

    expect(component.selectedPublication).toBe(dialogData.publications[1]);
    expect(component.text).toBe('Beta publication');
    expect(component.date).toBe('1902-02-02');
    expect(component.itemId).toBe('42_2');
    expect(component.language).toBe('sv');

    const inputValues = Array.from(
      fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>
    ).map(input => input.value);

    expect(inputValues).toContain('Beta publication');
    expect(inputValues).toContain('42_2');
  });
});
