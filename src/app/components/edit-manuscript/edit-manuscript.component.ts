import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Column } from '../../models/column';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { ProjectService } from '../../services/project.service';
import { Manuscript } from '../../models/publication';

interface InputData {
  manuscript: Manuscript;
  publicationId: number;
  columns: Column[];
}

@Component({
  selector: 'app-edit-manuscript',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, CustomDatePipe],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './edit-manuscript.component.html',
  styleUrl: './edit-manuscript.component.scss'
})
export class EditManuscriptComponent {

  constructor(private projectService: ProjectService) { }

  readonly data = inject<InputData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit() {
    this.form = new FormGroup({});

    this.data.columns.forEach((column) => {
      let value: string | number | null | Date = this.data.manuscript[column.field as keyof Manuscript] || '';

      const validators = [];
      if (column.required) {
        validators.push(Validators.required);
      }

      if (column.type === 'date') {
        value = value === '' ? null : new Date(value);
      }

      this.form.addControl(
        column.field,
        new FormControl({ value, disabled: !column.editable }, { validators })
      );
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    const payload = {
      title: this.form.value.name,
      filename: this.form.value.original_filename,
      published: this.form.value.published ? this.form.value.published : null,
      sort_order: this.form.value.sort_order,
    }

    if (this.data.manuscript.id) {
      this.projectService.editManuscript(this.data.manuscript.id, payload).subscribe(() => {});
    } else {
      this.projectService.addManuscript(this.data.publicationId, payload).subscribe(() => {});
    }

  }

}
