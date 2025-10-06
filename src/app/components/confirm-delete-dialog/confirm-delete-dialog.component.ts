import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDeleteDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText }}</button>
      <button mat-button [mat-dialog-close]="true" color="warn">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteDialogData) {}
}
