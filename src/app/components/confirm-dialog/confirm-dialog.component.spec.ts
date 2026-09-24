import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';

import { getCommonTestingProviders } from '../../../testing/test-providers';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  const dialogData: ConfirmDialogData = {
    message: 'Confirm the update.',
    cancelText: 'Cancel',
    confirmText: 'Confirm',
    showCascadeBoolean: true,
    showMetadataFields: true,
    metadataFields: [
      { key: 'date', label: 'Date', defaultSelected: false }
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
      imports: [ConfirmDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returns scalar and indexed fields toggled through ngModel', async () => {
    const toggles = fixture.nativeElement.querySelectorAll(
      'mat-slide-toggle button'
    ) as NodeListOf<HTMLButtonElement>;
    const confirmButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.trim() === 'Confirm');
    const confirmDialogClose = fixture.debugElement
      .queryAll(By.directive(MatDialogClose))
      .map(element => element.injector.get(MatDialogClose))
      .find(dialogClose => dialogClose.dialogResult?.value === true);

    expect(toggles.length).toBe(2);
    expect(Array.from(toggles).every(toggle => toggle.getAttribute('aria-checked') === 'false')).toBe(true);

    toggles[0].click();
    toggles[1].click();
    await fixture.whenStable();

    expect(Array.from(toggles).every(toggle => toggle.getAttribute('aria-checked') === 'true')).toBe(true);
    expect(component.cascadeBoolean).toBe(true);
    expect(component.selectedMetadataFields['date']).toBe(true);
    expect(confirmDialogClose?.dialogResult).toEqual({
      value: true,
      cascadeBoolean: true,
      selectedMetadataFields: { date: true },
      selectedTocUpdateFields: {}
    });
    expect(confirmButton).toBeDefined();

    confirmButton?.click();
    await fixture.whenStable();

    expect(dialogRef.close).toHaveBeenCalledWith({
      value: true,
      cascadeBoolean: true,
      selectedMetadataFields: { date: true },
      selectedTocUpdateFields: {}
    });
  });
});
