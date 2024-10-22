import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounce, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule, DatePipe } from '@angular/common';
import { EditProjectData, Project } from '../../models/project';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router } from '@angular/router';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { Column } from '../../models/column';
import { QueryParamsService } from '../../services/query-params.service';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EditDialogComponent } from '../../components/edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe, LoadingSpinnerComponent,
    CustomTableComponent, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  projects$: Observable<Project[]> = new Observable<Project[]>();
  filteredProjects$: Observable<Project[]> = new Observable<Project[]>();
  columnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number', filterable: true, editable: false },
    { field: 'name', header: 'Name', type: 'string', filterable: true, editable: true },
    { field: 'published', header: 'Published', type: 'published', filterable: true, editable: true },
    { field: 'date_created', header: 'Date Created', type: 'date', filterable: false, editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', filterable: false, editable: false },
    { field: 'action', header: 'Action', type: 'action', filterable: false }
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);
  url$ = new Observable<string>();

  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private router: Router,
    private queryParamsService: QueryParamsService,
    private snackBar: MatSnackBar
  ) { }

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
        if (queryParams['id']) {
          projects = projects.filter(project => project.id === parseInt(queryParams['id']));
        }

        return projects;
      })
    );

  }

  editProject(project: Project | null = null) {
    const columns = this.columnsData.filter(column => column.field != 'action').map(column => {
      return { ...column, editable: column.field === 'published' ? (project != null) : column.editable }
    })
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '300px',
      data: {
        model: project ?? {},
        columns: columns.sort((a: any, b: any) => b.editable - a.editable),
        title: 'Project'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const data = result.form.value as EditProjectData;
        let req;
        if (project?.id) {
          req = this.projectService.editProject(project.id, data);
        } else {
          req = this.projectService.addProject(data);
        }
        req.subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackBar.open('Project saved successfully', 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackBar.open('Error saving project', 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      }
    });
  }

  filterProjects() {
    const columns = this.columnsData.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      width: '250px',
      data: columns
    });
  }

}
