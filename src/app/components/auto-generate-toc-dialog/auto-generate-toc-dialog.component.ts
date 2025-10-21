import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';


export interface AutoGenerateTocDialogData {
  selectedCollectionId: number;
  selectedSortOption: string;
  sortOptions: { value: string; label: string }[];
}

@Component({
  selector: 'auto-generate-toc-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './auto-generate-toc-dialog.component.html',
  styleUrls: ['./auto-generate-toc-dialog.component.scss']
})
export class AutoGenerateTocDialogComponent {
  private readonly data = inject<AutoGenerateTocDialogData>(MAT_DIALOG_DATA);

  selectedSortOption: string = this.data.selectedSortOption;
  sortOptions: { value: string; label: string }[] = this.data.sortOptions;
}
