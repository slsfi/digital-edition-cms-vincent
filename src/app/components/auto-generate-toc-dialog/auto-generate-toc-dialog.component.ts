import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { LabelledOption, LabelledSelectOption } from '../../models/common';


export interface AutoGenerateTocDialogData {
  selectedCollectionId: number;
  selectedSortOption: string;
  sortOptions: LabelledOption[];
  includedFields?: LabelledSelectOption[];
}

export interface AutoGenerateTocDialogResult {
  value: boolean;
  selectedSortOption?: string;
  selectedFields?: { [key: string]: boolean }
}

@Component({
  selector: 'auto-generate-toc-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './auto-generate-toc-dialog.component.html',
  styleUrls: ['./auto-generate-toc-dialog.component.scss']
})
export class AutoGenerateTocDialogComponent {
  private readonly data = inject<AutoGenerateTocDialogData>(MAT_DIALOG_DATA);

  selectedSortOption: string = this.data.selectedSortOption;
  sortOptions: LabelledOption[] = this.data.sortOptions;

  fields: LabelledSelectOption[] = this.data.includedFields || [];
  selectedFields: { [key: string]: boolean } = {};

  constructor() {
    this.fields.forEach(field => {
      this.selectedFields[field.key] = field.defaultSelected;
    });
  }
}
