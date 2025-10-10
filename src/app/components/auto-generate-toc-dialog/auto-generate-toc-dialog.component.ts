import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

export interface AutoGenerateTocDialogData {
  selectedCollectionId: number;
  selectedSortOption: string;
  sortOptions: { value: string; label: string }[];
}

@Component({
  selector: 'app-auto-generate-toc-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './auto-generate-toc-dialog.component.html',
  styleUrls: ['./auto-generate-toc-dialog.component.scss']
})
export class AutoGenerateTocDialogComponent {
  selectedSortOption: string;
  sortOptions: { value: string; label: string }[];
  isGenerating = false;

  constructor(
    public dialogRef: MatDialogRef<AutoGenerateTocDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AutoGenerateTocDialogData
  ) {
    this.selectedSortOption = data.selectedSortOption;
    this.sortOptions = data.sortOptions;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onGenerate(): void {
    this.isGenerating = true;
    // The actual generation will be handled by the parent component
    this.dialogRef.close({
      selectedSortOption: this.selectedSortOption
    });
  }
}
