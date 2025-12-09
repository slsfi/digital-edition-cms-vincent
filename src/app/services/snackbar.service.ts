import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';

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

}
