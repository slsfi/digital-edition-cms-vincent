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
import { FacsimileCollection, FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest } from '../../models/facsimile';

interface InputData {
  facsimile: FacsimileCollection;
  columns: Column[];
}

@Component({
  selector: 'app-edit-facsimile',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, CustomDatePipe],
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './edit-facsimile.component.html',
  styleUrl: './edit-facsimile.component.scss'
})
export class EditFacsimileComponent {

  constructor(private projectService: ProjectService) { }

  readonly data = inject<InputData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit() {
    this.form = new FormGroup({});

    this.data.columns.forEach((column) => {
      let value: string | number | null | Date = this.data.facsimile[column.field as keyof FacsimileCollection] || '';

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

    const payload = this.form.value as FacsimileCollectionEditRequest;

    console.log('Payload', payload);

    if (this.data.facsimile?.id) {
      this.projectService.editFacsimileCollection(this.data.facsimile.id, payload).subscribe(() => {});
    } else {
      const data: FacsimileCollectionCreateRequest = {
        title: payload.title,
        description: payload.description,
        folderPath: payload.folder_path,
        externalUrl: payload.external_url,
        numberOfPages: payload.number_of_pages,
        startPageNumber: payload.start_page_number,
      };
      this.projectService.addFacsimileCollection(data).subscribe(() => {});
    }

  }

}
