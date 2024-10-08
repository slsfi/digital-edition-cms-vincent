import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, switchMap } from 'rxjs';
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

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe],
  providers: [DatePipe],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent {

  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  url$: Observable<string> = new Observable<string>();

  subjects$: Observable<Person[]> = new Observable<Person[]>();
  filteredSubjects$: Observable<Person[]> = new Observable<Person[]>();
  selectedProject$: Observable<string | null> = new Observable<string | null>();

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', filterable: true, type: 'number', editable: true },
    { field: 'full_name', header: 'Full name', filterable: true, type: 'string', editable: true },
    { field: 'alias', header: 'Alias', filterable: true, type: 'string', editable: false },
    { field: 'date_born', header: 'Date Born', filterable: false, type: 'date', editable: true },
    { field: 'date_deceased', header: 'Date Deceased', filterable: false, type: 'date', editable: true },
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

  constructor(private projectService: ProjectService, private dialog: MatDialog, private router: Router, private queryParamsService: QueryParamsService) {
  }

  ngAfterViewInit() {
    this.selectedProject$ = this.projectService.selectedProject$;
    this.subjects$ = this.loader$.asObservable().pipe(
      startWith(null),
      switchMap(() => combineLatest([this.projectService.getSubjects(), this.projectService.selectedProject$]).pipe(
        map(([subjects, selectedProject]) => {
          return subjects
        })
      )),
    )

    // Listen for URL changes, start with the current URL to ensure the stream has an initial value
    this.url$ = this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      startWith(this.router.url), // Ensure the initial URL is emitted when the component is initialized
      map((event: any) => event instanceof NavigationEnd ? event.url : event)
    );

    this.filteredSubjects$ = combineLatest([this.subjects$, this.url$]).pipe(
      map(([subjects, url]) => {
        const queryParams = this.queryParamsService.getQueryParams();
        // Filter projects based on query params
        if (queryParams['full_name']) {
          subjects = subjects.filter(project => project.full_name?.includes(queryParams['full_name']));
        }
        if (queryParams['legacy_id']) {
          subjects = subjects.filter(project => project.legacy_id === queryParams['legacy_id']);
        }
        if (queryParams['id']) {
          subjects = subjects.filter(project => project.id === parseInt(queryParams['id']));
        }
        if (queryParams['alias']) {
          subjects = subjects.filter(project => project.alias?.includes(queryParams['alias']));
        }
        return subjects
      })
    );
  }

  edit(person: Person | null = null) {
    console.log('edit', person);
    const dialogRef = this.dialog.open(EditPersonComponent, {
      width: '400px',
      data: { person: person ?? {}, columns: this.allColumns.filter(column => column.type !== 'action') }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loader$.next(0);
      }
    });
  }

  filterPersons() {
    console.log('filterPersons');
    const columns = this.columnsData.filter(column => column.filterable);
    const dialogRef = this.dialog.open(TableFiltersComponent, {
      width: '250px',
      data: columns
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        console.log('filtering projects');
      }
    });

  }


}
