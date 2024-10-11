import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PublicationCollection } from '../../models/publication';
import { Column } from '../../models/column';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ProjectService } from '../../services/project.service';

interface InputData {
  collection: PublicationCollection;
  columns: Column[];
}

@Component({
  selector: 'app-edit-publication-collection',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatSelectModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './edit-publication-collection.component.html',
  styleUrl: './edit-publication-collection.component.scss'
})
export class EditPublicationCollectionComponent {

  readonly data = inject<InputData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.form = new FormGroup({});
    this.data.columns.forEach((column) => {
      const value = this.data.collection[column.field as keyof PublicationCollection];
      this.form.addControl(column.field, new FormControl ({ value, disabled: !column.editable }));
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    console.log(this.form.value);
    if (this.data.collection.id) {
      this.projectService.editPublicationCollection(this.data.collection.id, this.form.value).subscribe(() => {});
    } else {
      this.projectService.addPublicationCollection(this.form.value).subscribe(() => {});
    }
  }

}
