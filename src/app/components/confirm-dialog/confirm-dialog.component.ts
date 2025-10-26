
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { LabelledSelectOption } from '../../models/common';


export interface ConfirmDialogData {
  message: string;
  cancelText: string;
  confirmText: string;
  title?: string;
  showCascadeBoolean?: boolean;
  cascadeText?: string;
  showMetadataFields?: boolean;
  metadataFields?: LabelledSelectOption[];
  showTocUpdateFields?: boolean;
  tocUpdateFields?: LabelledSelectOption[];
}

@Component({
  selector: 'confirm-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatSlideToggleModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  title = this.data.title ?? ''; 
  message = this.data.message ?? '';
  cancelText = this.data.cancelText ?? 'Cancel';
  confirmText = this.data.confirmText ?? 'Confirm';
  cascadeText = this.data.cascadeText || 'Cascade';
  showCascadeBoolean = this.data.showCascadeBoolean || false;
  showMetadataFields = this.data.showMetadataFields || false;
  showTocUpdateFields = this.data.showTocUpdateFields || false;
  metadataFields: LabelledSelectOption[] = this.data.metadataFields || [];
  tocUpdateFields: LabelledSelectOption[] = this.data.tocUpdateFields || [];
  cascadeBoolean = false;
  selectedMetadataFields: { [key: string]: boolean } = {};
  selectedTocUpdateFields: { [key: string]: boolean } = {};

  constructor() {    
    // Initialize selected fields with defaults
    this.metadataFields.forEach(field => {
      this.selectedMetadataFields[field.key] = field.defaultSelected;
    });

    this.tocUpdateFields.forEach(field => {
      this.selectedTocUpdateFields[field.key] = field.defaultSelected;
    });
  }
}
