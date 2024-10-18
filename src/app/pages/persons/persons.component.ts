import { ApiService } from './../../services/api.service';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounce, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
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
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { NavigationEnd, Router } from '@angular/router';
import { QueryParamsService } from '../../services/query-params.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe, ScrollingModule, MatChipsModule, MatBadgeModule, LoadingSpinnerComponent],
  providers: [DatePipe],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent {

  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  url$: Observable<string> = new Observable<string>();

  subjects$: Observable<Person[]> = new Observable<Person[]>();
  filteredSubjects$: Observable<Person[]> = new Observable<Person[]>();
  selectedProject$!: Observable<string | null>;
  queryParams$: Observable<any> = new Observable<any>();
  allSubjectsLength: number = 0;

  loading$: Observable<boolean>;

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', filterable: true, type: 'string', editable: true, editOrder: 5 },
    { field: 'full_name', header: 'Full name', filterable: true, type: 'string', editable: true, editOrder: 1 },
    { field: 'description', header: 'Description', filterable: false, type: 'textarea', editable: true, required: true, editOrder: 2, translations: true },
    { field: 'date_born', header: 'Date Born', filterable: false, type: 'date', editable: true, editOrder: 3 },
    { field: 'date_deceased', header: 'Date Deceased', filterable: false, type: 'date', editable: true, editOrder: 3 },
    { field: 'translation_id', header: 'Translation ID', filterable: false, type: 'string', editable: false },
    { field: 'action', header: 'Actions', filterable: false, type: 'action' },
  ]

  allColumns: Column[] = [
    ...this.columnsData,
    { field: 'date_created', header: 'Date created', filterable: false, type: 'string', editable: false },
    { field: 'date_modified', header: 'Date modified', filterable: false, type: 'string', editable: false },
    { field: 'deleted', header: 'Deleted', filterable: false, type: 'boolean', editable: false },
    { field: 'alias', header: 'Alias', filterable: false, type: 'string', editable: false },
    { field: 'first_name', header: 'First name', filterable: false, type: 'string', editable: true, editOrder: 0 },
    { field: 'last_name', header: 'Last name', filterable: false, type: 'string', editable: true, editOrder: 0 },
    { field: 'occupation', header: 'Occupation', filterable: false, type: 'string', editable: false, translations: true },
    { field: 'place_of_birth', header: 'Place of birth', filterable: false, type: 'string', editable: false },
    { field: 'preposition', header: 'Preposition', filterable: false, type: 'string', editable: true, editOrder: 0  },
    { field: 'previous_last_name', header: 'Previous last name', filterable: false, type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', filterable: false, type: 'number', editable: false },
    { field: 'source', header: 'Source', filterable: false, type: 'string', editable: false },
    // { field: 'translation_id', header: 'Translation ID', filterable: false, type: 'string', editable: false },
    { field: 'type', header: 'Type', filterable: true, type: 'type', editable: true, required: true, editOrder: 4 },
  ]

  displayedColumns: string[] = this.columnsData.map(column => column.field);

  constructor(private projectService: ProjectService, private dialog: MatDialog, private router: Router, private queryParamsService: QueryParamsService, private apiService: ApiService) {
    this.loading$ = this.apiService.loading$;
    this.selectedProject$ = this.projectService.selectedProject$;
    // Listen for URL changes, start with the current URL to ensure the stream has an initial value
    this.url$ = this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      startWith(this.router.url), // Ensure the initial URL is emitted when the component is initialized
      map((event: any) => event instanceof NavigationEnd ? event.url : event)
    );

    this.queryParams$ = this.url$.pipe(
      map(() => {
        const params = this.queryParamsService.getQueryParams()
        return Object.entries(params).map(([key, value]) => {
          const header = this.columnsData.find(column => column.field === key)?.header;
          return { key, value, header }
        })
      })
    );
  }

  ngAfterViewInit() {
    this.subjects$ = this.loader$.asObservable().pipe(
      startWith(null),
      debounce(i => timer(500)),
      switchMap(() => combineLatest([this.projectService.getSubjects(), this.projectService.selectedProject$]).pipe(
        map(([subjects, selectedProject]) => {
          return subjects
            .map(subject => ({ ...subject, sortColumn: subject.last_name || subject.full_name || '' }))
            .sort((a, b) => a.sortColumn.localeCompare(b.sortColumn));
        })
      )),
    )

    this.filteredSubjects$ = combineLatest([this.subjects$, this.url$]).pipe(
      map(([subjects, url]) => {
        this.allSubjectsLength = subjects.length;
        const queryParams = this.queryParamsService.getQueryParams();
        // Filter projects based on query params
        if (queryParams['full_name']) {
          subjects = subjects.filter(project => project.full_name?.toLowerCase().includes(queryParams['full_name'].toLowerCase()));
        }
        if (queryParams['legacy_id']) {
          subjects = subjects.filter(project => project.legacy_id === queryParams['legacy_id']);
        }
        if (queryParams['id']) {
          subjects = subjects.filter(project => project.id === parseInt(queryParams['id']));
        }
        if (queryParams['type']) {
          subjects = subjects.filter(project => project.type === queryParams['type']);
        }
        return subjects;
      })
    );
  }

  edit(person: Person | null = null) {
    const dialogRef = this.dialog.open(EditPersonComponent, {
      width: '500px',
      data: {
        person: person ?? {},
        columns: this.allColumns
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable)
          .sort((a: any, b: any) => a.editOrder - b.editOrder)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loader$.next(0);
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
