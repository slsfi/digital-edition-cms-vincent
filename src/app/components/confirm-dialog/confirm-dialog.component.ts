
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface MetadataFieldOption {
  key: string;
  label: string;
  defaultSelected: boolean;
}

export interface ConfirmDialogData {
  message: string;
  cancelText: string;
  confirmText: string;
  title?: string;
  showCascadeBoolean?: boolean;
  cascadeText?: string;
  showMetadataFields?: boolean;
  metadataFields?: MetadataFieldOption[];
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
  title = ''; 
  message = '';
  cancelText = 'Cancel';
  confirmText = 'Confirm';
  showCascadeBoolean = false;
  cascadeText = 'Cascade';
  showMetadataFields = false;
  metadataFields: MetadataFieldOption[] = [];
  selectedFields: { [key: string]: boolean } = {};
  cascadeBoolean = false;

  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  constructor() {
    this.title = this.data.title ?? '';
    this.message = this.data.message;
    this.cancelText = this.data.cancelText;
    this.confirmText = this.data.confirmText;
    this.showCascadeBoolean = this.data.showCascadeBoolean || false;
    this.cascadeText = this.data.cascadeText || 'Cascade';
    this.showMetadataFields = this.data.showMetadataFields || false;
    this.metadataFields = this.data.metadataFields || [];
    
    // Initialize selected fields with defaults
    this.metadataFields.forEach(field => {
      this.selectedFields[field.key] = field.defaultSelected;
    });
  }
}
