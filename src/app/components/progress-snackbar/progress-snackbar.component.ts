import { Component, inject, Signal } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarLabel } from '@angular/material/snack-bar';

@Component({
  selector: 'progress-snackbar',
  imports: [MatSnackBarLabel],
  template: '<span matSnackBarLabel>{{ message() }}</span>',
  styles: ':host { display: flex; }'
})
export class ProgressSnackbarComponent {
  readonly message = inject<Signal<string>>(MAT_SNACK_BAR_DATA);
}
