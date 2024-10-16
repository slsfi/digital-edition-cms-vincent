import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounce, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Project } from '../../models/project';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EditProjectComponent } from '../../components/edit-project/edit-project.component';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router } from '@angular/router';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { Column } from '../../models/column';
import { QueryParamsService } from '../../services/query-params.service';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe, LoadingSpinnerComponent],
  providers: [DatePipe],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  projects$: Observable<Project[]> = new Observable<Project[]>();
  filteredProjects$: Observable<Project[]> = new Observable<Project[]>();
  columnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number', filterable: true },
    { field: 'name', header: 'Name', type: 'string', filterable: true },
    { field: 'published', header: 'Published', type: 'published', filterable: true },
    { field: 'deleted', header: 'Deleted', type: 'boolean', filterable: true },
    { field: 'date_created', header: 'Date Created', type: 'date', filterable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', filterable: false },
    { field: 'action', header: 'Action', type: 'action', filterable: false }
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);
  url$ = new Observable<string>();

  constructor(private projectService: ProjectService, private dialog: MatDialog, private router: Router, private queryParamsService: QueryParamsService) {

  }

  ngAfterViewInit() {
    this.projects$ = this.loader$.asObservable().pipe(
      startWith(null),
      debounce(i => timer(500)),
      switchMap(() => this.projectService.getProjects()),
    )
    // Listen for URL changes, start with the current URL to ensure the stream has an initial value
    this.url$ = this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      startWith(this.router.url), // Ensure the initial URL is emitted when the component is initialized
      map((event: any) => event instanceof NavigationEnd ? event.url : event)
    );
    this.filteredProjects$ = combineLatest([this.projects$, this.url$]).pipe(
      map(([projects, url]) => {
        const queryParams = this.queryParamsService.getQueryParams();
        // Filter projects based on query params
        if (queryParams['name']) {
          projects = projects.filter(project => project.name.includes(queryParams['name']));
        }
        if (queryParams['published']) {
          projects = projects.filter(project => project.published === parseInt(queryParams['published']));
        }
        if (queryParams['deleted']) {
          projects = projects.filter(project => project.deleted === parseInt(queryParams['deleted']));
        }
        if (queryParams['id']) {
          projects = projects.filter(project => project.id === parseInt(queryParams['id']));
        }

        return projects;
      })
    );

  }

  editProject(project: Project | null = null) {
    const dialogRef = this.dialog.open(EditProjectComponent, {
      width: '300px',
      data: project ?? {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // force projects to reload
        this.loader$.next(0);
      }
    });
  }

  filterProjects() {
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
