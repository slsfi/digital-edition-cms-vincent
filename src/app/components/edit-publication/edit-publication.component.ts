import { Publication } from './../../models/publication';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Column } from '../../models/column';
import { ProjectService } from '../../services/project.service';

interface InputData {
  collectionId: number;
  publication: Publication;
  columns: Column[];
}


@Component({
  selector: 'app-edit-publication',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './edit-publication.component.html',
  styleUrl: './edit-publication.component.scss'
})
export class EditPublicationComponent {

  readonly data = inject<InputData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.form = new FormGroup({});
    this.data.columns.forEach((column) => {
      let value = this.getValue(column);
      if (column.type === 'date' && value != null) {
        value = value === '' ? null : new Date(value);
        // catch invalid date
        if (isNaN(value as any)) {
          value = (this.getValue(column) as string).replace('XX-XX', '01-01');
        }
      }
      this.form.addControl(column.field, new FormControl({ value, disabled: !column.editable }));
    });
  }

  getValue(column: Column) : string | number | null | Date {
    return this.data.publication[column.field as keyof Publication];
  }

  onSubmit(event: Event) {
    event.preventDefault();
    console.log(this.form.value);
    if (this.data.publication.id) {
      this.projectService.editPublication(this.data.publication.id, this.form.value).subscribe(() => {});
    } else {
      this.projectService.addPublication(this.data.collectionId, this.form.value).subscribe(() => {});
    }
  }

}
