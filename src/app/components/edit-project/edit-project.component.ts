import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EditProjectData, Project } from '../../models/project';
import { ProjectService } from '../../services/project.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'edit-project',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './edit-project.component.html',
  styleUrl: './edit-project.component.scss'
})
export class EditProjectComponent {

  constructor(private projectService: ProjectService) {}

  readonly data = inject<Project>(MAT_DIALOG_DATA);

  addProjectForm = new FormGroup({
    id: new FormControl({ value: this.data?.id, disabled: true }),
    name: new FormControl(this.data.name, {nonNullable: true, validators: [Validators.required]}),
    published: new FormControl(this.data.published, this.data.name ? Validators.required: null),
    deleted: new FormControl({ value: this.data?.deleted, disabled: true }),
    date_created: new FormControl({ value: this.data?.date_created, disabled: true }),
    date_modified: new FormControl({ value: this.data?.date_modified, disabled: true }),
  });

  onSubmit(event: Event) {
    event.preventDefault();
    const data = this.addProjectForm.value as EditProjectData;
    if (this.data.id) {
      this.projectService.editProject(this.data.id, data).subscribe(() => {});
    } else {
      this.projectService.addProject(data).subscribe(() => {});
    }
  }
}
