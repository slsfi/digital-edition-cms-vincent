import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface ConfirmDialogData {
  message: string;
  cancelText: string;
  confirmText: string;
  showCascadeBoolean: boolean;
  cascadeText: string;
}

@Component({
  selector: 'app-comfirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatSlideToggleModule, FormsModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  message: string = '';
  cancelText: string = 'Cancel';
  confirmText: string = 'Confirm';
  showCascadeBoolean = false;
  cascadeText: string = 'Cascade';

  cascadeBoolean = false;


  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  constructor() {
    this.message = this.data.message;
    this.cancelText = this.data.cancelText;
    this.confirmText = this.data.confirmText;
    this.showCascadeBoolean = this.data.showCascadeBoolean;
    this.cascadeText = this.data.cascadeText;
  }

}
