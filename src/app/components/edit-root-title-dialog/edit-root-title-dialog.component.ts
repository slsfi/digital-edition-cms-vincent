import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface EditRootTitleDialogData {
  currentTitle: string;
}

@Component({
  selector: 'app-edit-root-title-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './edit-root-title-dialog.component.html',
  styleUrls: ['./edit-root-title-dialog.component.scss']
})
export class EditRootTitleDialogComponent {
  title: string;

  constructor(
    public dialogRef: MatDialogRef<EditRootTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditRootTitleDialogData
  ) {
    this.title = data.currentTitle;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.title.trim()) {
      this.dialogRef.close(this.title.trim());
    }
  }
}
