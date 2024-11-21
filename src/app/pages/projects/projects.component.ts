import { QueryParamsService } from './../../services/query-params.service';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule, DatePipe } from '@angular/common';
import { EditProjectData, Project } from '../../models/project';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { Column, Deleted } from '../../models/common';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EditDialogComponent, EditDialogData } from '../../components/edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { LoadingService } from '../../services/loading.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, CustomDatePipe, LoadingSpinnerComponent,
    CustomTableComponent, CustomTableComponent, MatBadgeModule
  ],
  providers: [DatePipe],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  projects$: Observable<Project[]> = of([]);
  filterParams$;

  columnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number', filterable: true, editable: false, filterType: 'equals' },
    { field: 'name', header: 'Name', type: 'string', filterable: true, editable: true, filterType: 'contains' },
    { field: 'published', header: 'Published', type: 'published', filterable: true, editable: true, filterType: 'equals' },
    { field: 'date_created', header: 'Date creted', type: 'date', filterable: false, editable: false },
    { field: 'date_modified', header: 'Date modified', type: 'date', filterable: false, editable: false },
    { field: 'actions', header: 'Action', type: 'action', filterable: false }
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);

  loading$;

  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private queryParamsService: QueryParamsService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.filterParams$ = this.queryParamsService.filterParams$
   }

  ngOnInit() {
    this.projects$ = this.loader$.asObservable().pipe(
      switchMap(() => this.projectService.getProjects())
    );
  }

  editProject(project: Project | null = null) {
    const columns = this.columnsData.filter(column => column.field != 'action').map(column => {
      let editable = column.editable;
      if (column.field === 'name') {
        editable = project == null;
      }
      return { ...column, editable }
    })
    const data: EditDialogData<Project> = {
      model: project,
      columns: columns,
      title: 'project'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

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
          }
        });
      }
    });
  }

  filterProjects() {
    const columns = this.columnsData.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      data: columns
    });
  }

  deleteProject(project: Project) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this project?',
        cancelText: 'No',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        const payload = { ...project, deleted: Deleted.Deleted };
        this.projectService.editProject(project.id, payload).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackBar.open('Project deleted successfully', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

}
