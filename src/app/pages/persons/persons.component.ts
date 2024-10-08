import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, startWith, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Person } from '../../models/person';
import { MatTableModule } from '@angular/material/table';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { MatDialog } from '@angular/material/dialog';
import { EditPersonComponent } from '../../components/edit-person/edit-person.component';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe],
  providers: [DatePipe],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent {

  $loader: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  $subjects: Observable<Person[]> = new Observable<Person[]>();
  $selectedProject: Observable<string | null> = new Observable<string | null>();

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', filterable: true, type: 'number', editable: true },
    { field: 'full_name', header: 'Full name', filterable: true, type: 'string', editable: true },
    { field: 'alias', header: 'Alias', filterable: true, type: 'string', editable: false },
    { field: 'date_born', header: 'Date Born', filterable: true, type: 'date', editable: true },
    { field: 'date_deceased', header: 'Date Deceased', filterable: true, type: 'date', editable: true },
    { field: 'action', header: 'Actions', filterable: false, type: 'action' },
  ]

  allColumns: Column[] = [
    ...this.columnsData,
    { field: 'date_created', header: 'Date created', filterable: false, type: 'date', editable: false },
    { field: 'date_modified', header: 'Date modified', filterable: false, type: 'date', editable: false },
    { field: 'deleted', header: 'Deleted', filterable: true, type: 'boolean', editable: false },
    { field: 'description', header: 'Description', filterable: true, type: 'textarea', editable: true, required: true },
    { field: 'first_name', header: 'First name', filterable: true, type: 'string', editable: true },
    { field: 'last_name', header: 'Last name', filterable: true, type: 'string', editable: true },
    { field: 'occupation', header: 'Occupation', filterable: true, type: 'string', editable: false },
    { field: 'place_of_birth', header: 'Place of birth', filterable: true, type: 'string', editable: false },
    { field: 'preposition', header: 'Preposition', filterable: true, type: 'string', editable: true },
    { field: 'previous_last_name', header: 'Previous last name', filterable: true, type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', filterable: true, type: 'number', editable: false },
    { field: 'source', header: 'Source', filterable: true, type: 'string', editable: false },
    { field: 'translation_id', header: 'Translation ID', filterable: true, type: 'string', editable: false },
    { field: 'type', header: 'Type', filterable: true, type: 'type', editable: true, required: true },
  ]

  displayedColumns: string[] = this.columnsData.map(column => column.field);

  constructor(private projectService: ProjectService, private dialog: MatDialog) {
  }

  ngAfterViewInit() {
    this.$selectedProject = this.projectService.$selectedProject;
    this.$subjects = this.$loader.asObservable().pipe(
      startWith(null),
      switchMap(() => combineLatest([this.projectService.getSubjects(), this.projectService.$selectedProject]).pipe(
        map(([subjects, selectedProject]) => {
          return subjects
        })
      )),
    )
  }

  edit(person: Person | null = null) {
    console.log('edit', person);
    const dialogRef = this.dialog.open(EditPersonComponent, {
      width: '400px',
      data: { person: person ?? {}, columns: this.allColumns.filter(column => column.type !== 'action') }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.$loader.next(0);
      }
    });

  }


}
