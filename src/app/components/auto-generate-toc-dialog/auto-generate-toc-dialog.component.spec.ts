import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { getCommonTestingProviders } from '../../../testing/test-providers';
import {
  AutoGenerateTocDialogComponent,
  AutoGenerateTocDialogData
} from './auto-generate-toc-dialog.component';

describe('AutoGenerateTocDialogComponent', () => {
  let component: AutoGenerateTocDialogComponent;
  let fixture: ComponentFixture<AutoGenerateTocDialogComponent>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  const dialogData: AutoGenerateTocDialogData = {
    selectedCollectionId: 42,
    selectedSortOption: 'sort_order',
    sortOptions: [
      { key: 'sort_order', label: 'Sort order' }
    ],
    includedFields: [
      { key: 'subtitle', label: 'Subtitle', defaultSelected: false }
    ]
  };

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AutoGenerateTocDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoGenerateTocDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('returns a field toggled through ngModel', async () => {
    const fieldToggle = fixture.nativeElement.querySelector(
      'mat-slide-toggle button'
    ) as HTMLButtonElement;
    const generateButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.trim() === 'Generate');
    const generateDialogClose = fixture.debugElement
      .queryAll(By.directive(MatDialogClose))
      .map(element => element.injector.get(MatDialogClose))
      .find(dialogClose => dialogClose.dialogResult?.value === true);

    expect(fieldToggle.getAttribute('aria-checked')).toBe('false');
    expect(generateDialogClose).toBeDefined();

    fieldToggle.click();
    await fixture.whenStable();

    expect(fieldToggle.getAttribute('aria-checked')).toBe('true');
    expect(component.selectedFields['subtitle']).toBe(true);
    expect(generateDialogClose?.dialogResult).toEqual({
      value: true,
      selectedSortOption: 'sort_order',
      selectedFields: { subtitle: true }
    });
    expect(generateButton).toBeDefined();

    generateButton?.click();
    await fixture.whenStable();

    expect(dialogRef.close).toHaveBeenCalledWith({
      value: true,
      selectedSortOption: 'sort_order',
      selectedFields: { subtitle: true }
    });
  });
});
