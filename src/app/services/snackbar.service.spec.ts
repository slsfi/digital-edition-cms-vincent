import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'snackbar-test-host',
  template: ''
})
class SnackbarTestHostComponent {}

describe('SnackbarService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders progress updates without reopening and stays visible until explicitly dismissed', async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [SnackbarTestHostComponent],
      providers: [{ provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 5000 } }]
    }).compileComponents();
    const fixture = TestBed.createComponent(SnackbarTestHostComponent);
    fixture.detectChanges();
    const service = TestBed.inject(SnackbarService);
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    const message = signal('Saving publication 1 / 3…');
    const ref = service.showProgress(message);
    const dismissed = vi.fn();
    ref.afterDismissed().subscribe(dismissed);

    await vi.advanceTimersByTimeAsync(5001);
    await fixture.whenStable();
    const progress = container.querySelector('progress-snackbar');
    expect(progress?.textContent).toContain('Saving publication 1 / 3…');
    expect(dismissed).not.toHaveBeenCalled();

    message.set('Saving publication 2 / 3…');
    await vi.advanceTimersByTimeAsync(1);
    await fixture.whenStable();
    expect(container.querySelector('progress-snackbar')).toBe(progress);
    expect(progress?.textContent).toContain('Saving publication 2 / 3…');

    ref.dismiss();
    await vi.runAllTimersAsync();
    await fixture.whenStable();
    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(container.querySelector('progress-snackbar')).toBeNull();
  });
});
