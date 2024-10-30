import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDialogData {
  message: string;
  cancelText: string;
  confirmText: string;
}

@Component({
  selector: 'app-comfirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  @Input() message: string = '';
  @Input() cancelText: string = 'Cancel';
  @Input() confirmText: string = 'Confirm';


  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  constructor() {
    this.message = this.data.message;
    this.cancelText = this.data.cancelText;
    this.confirmText = this.data.confirmText;
  }

}
