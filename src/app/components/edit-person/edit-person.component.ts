import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Person, personTypeOptions } from '../../models/person';
import { MatInputModule } from '@angular/material/input';
import { Column } from '../../models/column';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { ProjectService } from '../../services/project.service';

interface InputData {
  person: Person;
  columns: Column[];
}

@Component({
  selector: 'app-edit-person',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, CustomDatePipe],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './edit-person.component.html',
  styleUrl: './edit-person.component.scss'
})
export class EditPersonComponent {

  constructor(private projectService: ProjectService) { }

  readonly data = inject<InputData>(MAT_DIALOG_DATA);

  personTypes = personTypeOptions;

  form!: FormGroup;
  columns: Column[] = [];

  isBCDate(dateString: string | number | null) {
    if (dateString == null) {
      return false;
    }
    if (typeof dateString === 'number') {
      return dateString < 0;
    }
    return dateString.includes('BC');
  }

  ngOnInit() {
    this.form = new FormGroup({});

    const copiedColumns = this.data.columns.map((column) => ({ ...column }));
    copiedColumns.forEach((column) => {
      if (column.type === 'date' && this.isBCDate(this.data.person[column.field as keyof Person])) {
        column.type = 'string';
      }
    });
    this.columns = copiedColumns;
    this.columns.forEach((column) => {
      let value: string | number | null | Date = this.data.person[column.field as keyof Person] || '';

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
    console.log('PersonForm submitted', this.form.value);
    if (this.data.person.id) {
      this.projectService.editSubject(this.data.person.id, this.form.value).subscribe(() => {});
    } else {
      this.projectService.addSubject(this.form.value).subscribe(() => {});
    }

  }

}
