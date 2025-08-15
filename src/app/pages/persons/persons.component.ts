import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, Observable, of, switchMap, take } from 'rxjs';

import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { EditDialogComponent, EditDialogData } from '../../components/edit-dialog/edit-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { Column, Deleted } from '../../models/common';
import { Person } from '../../models/person';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { QueryParamsService } from '../../services/query-params.service';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-persons',
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, ScrollingModule, MatChipsModule,
    MatBadgeModule, LoadingSpinnerComponent, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent implements OnInit {

  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  selectedProject$;
  filterParams$;
  loading$;
  persons$: Observable<Person[]> = of([]);

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false, filterType: 'equals' },
    { field: 'legacy_id', header: 'Legacy ID', filterable: true, type: 'string', editable: true, editOrder: 5, filterType: 'equals' },
    { field: 'full_name', header: 'Full name', filterable: true, type: 'string', editable: true, editOrder: 1, filterType: 'contains' },
    { field: 'description', header: 'Description', filterable: true, filterType: 'contains', type: 'textarea', editable: true, editOrder: 2, translations: true },
    { field: 'date_born', header: 'Date born', filterable: false, type: 'string', editable: true, editOrder: 3 },
    { field: 'date_deceased', header: 'Date deceased', filterable: false, type: 'string', editable: true, editOrder: 3 },
    { field: 'type', header: 'Type', visible: false, filterable: true, type: 'person_type', editable: true, editOrder: 4 },
    { field: 'actions', header: 'Actions', filterable: false, type: 'action' },
  ]

  allColumns: Column[] = [
    ...this.columnsData,
    { field: 'date_created', header: 'Date created', filterable: false, type: 'string', editable: false },
    { field: 'date_modified', header: 'Date modified', filterable: false, type: 'string', editable: false },
    { field: 'deleted', header: 'Deleted', filterable: false, type: 'boolean', editable: false },
    { field: 'alias', header: 'Alias', filterable: false, type: 'string', editable: true },
    { field: 'first_name', header: 'First name', filterable: false, type: 'string', editable: true, editOrder: 0 },
    { field: 'last_name', header: 'Last name', filterable: false, type: 'string', editable: true, editOrder: 0 },
    { field: 'occupation', header: 'Occupation', filterable: false, type: 'string', editable: true, translations: true },
    { field: 'place_of_birth', header: 'Place of birth', filterable: false, type: 'string', editable: true },
    { field: 'preposition', header: 'Preposition', filterable: false, type: 'string', editable: true, editOrder: 0  },
    { field: 'previous_last_name', header: 'Previous last name', filterable: false, type: 'string', editable: true },
    { field: 'project_id', header: 'Project ID', filterable: false, type: 'number', editable: false },
    { field: 'source', header: 'Source', filterable: false, type: 'string', editable: true },
    { field: 'translation_id', header: 'Translation ID', filterable: false, type: 'string', editable: false },
  ]

  displayedColumns: string[] = this.columnsData.map(column => column.field);

  constructor(
    private subjectService: SubjectService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private loadingService: LoadingService,
    private snackaBar: MatSnackBar
  ) {
    this.loading$ = this.loadingService.loading$;
    this.selectedProject$ = this.subjectService.selectedProject$;
    this.filterParams$ = this.queryParamsService.filterParams$;
  }

  ngOnInit() {
    this.persons$ = this.loader$.asObservable().pipe(
      switchMap(() => this.selectedProject$.pipe(
        switchMap(project => {
          if (!project) { return of([]); }
          return this.subjectService.getSubjects(project);
        })
      )),
    );
  }

  edit(person: Person | null = null) {
    const data: EditDialogData<Person> = {
      model: person,
      columns: this.allColumns,
      title: 'person',
      tableName: 'subject',
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let request$: Observable<Person>;
        const currentProject = this.projectService.getCurrentProject();
        if (person?.id) {
          request$ = this.subjectService.editSubject(person.id, result.form.value, currentProject);
        } else {
          request$ = this.subjectService.addSubject(result.form.value, currentProject);
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackaBar.open('Person saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  deleteRow(person: Person) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this person?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value === true) {
        const payload = { ...person, deleted: Deleted.Deleted };
        const currentProject = this.projectService.getCurrentProject();
        this.subjectService.editSubject(person.id, payload, currentProject).pipe(take(1)).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackaBar.open('Person deleted', 'Close', { panelClass: ['snackbar-success'] });
          },
        });
      }
    });
  }

  filterPersons() {
    const columns = this.allColumns.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      data: columns
    });
  }

}
