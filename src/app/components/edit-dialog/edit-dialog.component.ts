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
import { TranslationsComponent } from '../translations/translations.component';
import { personTypeOptions } from '../../models/person';
import { MatIconModule } from '@angular/material/icon';

interface InputData {
  model: any;
  columns: Column[];
  title: string;
}

@Component({
  selector: 'edit-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, CustomDatePipe, TranslationsComponent, MatIconModule],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './edit-dialog.component.html',
  styleUrl: './edit-dialog.component.scss'
})
export class EditDialogComponent {

  constructor() { }

  readonly data = inject<InputData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  columns: Column[] = [];
  personTypes = personTypeOptions;

  fieldForTranslate: string | null = null;

  ngOnInit() {
    const copiedColumns = this.data.columns.map((column) => ({ ...column }));
    copiedColumns.forEach((column) => {
      if (column.type === 'date' && this.isBCDate(this.data.model[column.field])) {
        column.type = 'string';
      }
    });
    this.columns = copiedColumns;

    this.form = new FormGroup({});

    this.columns.forEach((column) => {
      let value: string | number | null | Date = this.data.model[column.field] || '';

      const validators = [];
      if (column.required) {
        validators.push(Validators.required);
      }

      if (column.type === 'date' && value != null) {
        value = value === '' ? null : new Date(value);
      }

      this.form.addControl(
        column.field,
        new FormControl({ value, disabled: !column.editable }, { validators })
      );
    });
  }

  isBCDate(dateString: string | number | null) {
    if (dateString == null) {
      return false;
    }
    if (typeof dateString === 'number') {
      return dateString < 0;
    }
    return dateString.includes('BC');
  }

  showTranslations(column: Column) {
    this.fieldForTranslate = column.field;
  }

}
