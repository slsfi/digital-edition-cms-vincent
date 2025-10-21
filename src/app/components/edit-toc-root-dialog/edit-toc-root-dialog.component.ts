import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { IsEmptyStringPipe } from '../../pipes/is-empty-string.pipe';


export interface EditTocRootDialogData {
  title: string;
  coverPageName?: string;
  titlePageName?: string;
  forewordPageName?: string;
  introductionPageName?: string;
}

@Component({
  selector: 'edit-toc-root-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    IsEmptyStringPipe
  ],
  templateUrl: './edit-toc-root-dialog.component.html',
  styleUrls: ['./edit-toc-root-dialog.component.scss']
})
export class EditTocRootDialogComponent {
  private readonly data = inject<EditTocRootDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EditTocRootDialogComponent>);

  title = this.data.title;
  coverPageName = this.data.coverPageName;
  titlePageName = this.data.titlePageName;
  forewordPageName = this.data.forewordPageName;
  introductionPageName = this.data.introductionPageName;

  dismiss(): void {
    this.dialogRef.close({ value: false });
  }

  save(): void {
    const trimmedTitle = this.title.trim();
  
    if (trimmedTitle) {
      const coverPageName = (this.coverPageName ?? '').trim();
      const titlePageName = (this.titlePageName ?? '').trim();
      const forewordPageName = (this.forewordPageName ?? '').trim();
      const introductionPageName = (this.introductionPageName ?? '').trim();

      const result = {
        value: true,
        data: {
          title: trimmedTitle,
          ...(coverPageName !== '' ? {coverPageName} : {}),
          ...(titlePageName !== '' ? {titlePageName} : {}),
          ...(forewordPageName !== '' ? {forewordPageName} : {}),
          ...(introductionPageName !== '' ? {introductionPageName} : {}),
        }
      };

      this.dialogRef.close(result);
    }
  }
}
