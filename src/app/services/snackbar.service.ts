import { inject, Injectable, Signal } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

import { ProgressSnackbarComponent } from '../components/progress-snackbar/progress-snackbar.component';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private readonly snackbar = inject(MatSnackBar);

  show(
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'success',
    closeText = 'Close'
  ): MatSnackBarRef<SimpleSnackBar> {
    return this.snackbar.open(message, closeText, {
      ...(type !== 'success' ? { duration: undefined } : {}),
      panelClass: [`snackbar-${type}`]
    });
  }

  showProgress(message: Signal<string>): MatSnackBarRef<ProgressSnackbarComponent> {
    return this.snackbar.openFromComponent(ProgressSnackbarComponent, {
      data: message,
      duration: 0,
      politeness: 'polite',
      panelClass: ['snackbar-info']
    });
  }

}
