import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { Person } from '../../models/person';
import { MatTableModule } from '@angular/material/table';
import { Column, Deleted, QueryParamType } from '../../models/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { MatDialog } from '@angular/material/dialog';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { QueryParamsService } from '../../services/query-params.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { LoadingService } from '../../services/loading.service';
import { EditDialogComponent } from '../../components/edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { SubjectService } from '../../services/subject.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe, ScrollingModule, MatChipsModule,
    MatBadgeModule, LoadingSpinnerComponent, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent {

  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  selectedProject$!: Observable<string | null>;
  filterParams$: Observable<QueryParamType[]> = new Observable<QueryParamType[]>();
  loading$: Observable<boolean>;

  // private personsSource = new BehaviorSubject<Person[]>([]);
  // persons$: Observable<Person[]> = this.personsSource.asObservable();
  persons$: Observable<Person[]> = of([]);

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false, filterType: 'equals' },
    { field: 'legacy_id', header: 'Legacy ID', filterable: true, type: 'string', editable: true, editOrder: 5, filterType: 'equals' },
    { field: 'full_name', header: 'Full name', filterable: true, type: 'string', editable: true, editOrder: 1, filterType: 'contains' },
    { field: 'description', header: 'Description', filterable: false, type: 'textarea', editable: true, editOrder: 2, translations: true },
    { field: 'date_born', header: 'Date Born', filterable: false, type: 'string', editable: true, editOrder: 3 },
    { field: 'date_deceased', header: 'Date Deceased', filterable: false, type: 'string', editable: true, editOrder: 3 },
    { field: 'type', header: 'Type', visible: false, filterable: true, type: 'person_type', editable: true, editOrder: 4 },
    { field: 'actions', header: 'Actions', filterable: false, type: 'action' },
  ]

  allColumns: Column[] = [
    ...this.columnsData,
    { field: 'date_created', header: 'Date created', filterable: false, type: 'string', editable: false },
    { field: 'date_modified', header: 'Date modified', filterable: false, type: 'string', editable: false },
    { field: 'deleted', header: 'Deleted', filterable: false, type: 'boolean', editable: true },
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
      switchMap(() => combineLatest([this.subjectService.getSubjects(), this.subjectService.selectedProject$]).pipe(
        map(([subjects, selectedProject]) => subjects)
      )),
    );
  }

  edit(person: Person | null = null) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '500px',
      data: {
        model: person ?? {},
        columns: this.allColumns,
        title: 'Person'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let req;
        if (person?.id) {
          req = this.subjectService.editSubject(person.id, result.form.value);
        } else {
          req = this.subjectService.addSubject(result.form.value);
        }
        req.subscribe({
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
      width: '400px',
      data: {
        message: 'Are you sure you want to delete this person?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value === true) {
        const payload = { ...person, deleted: Deleted.Deleted };
        this.subjectService.editSubject(person.id, payload).subscribe({
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
      width: '250px',
      data: columns
    });
  }


}
