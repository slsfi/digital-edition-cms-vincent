import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap, take } from 'rxjs';

import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { EditDialogComponent, EditDialogData } from '../../components/edit-dialog/edit-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { FacsimileService } from '../../services/facsimile.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { QueryParamsService } from '../../services/query-params.service';
import { Column, Deleted } from '../../models/common.model';
import { FacsimileCollection, FacsimileCollectionResponse } from '../../models/facsimile.model';

@Component({
  selector: 'app-facsimiles',
  imports: [
    CommonModule, LoadingSpinnerComponent, MatTableModule, MatIconModule, MatButtonModule, ScrollingModule,
    MatBadgeModule, CustomTableComponent, MatMenuModule
  ],
  templateUrl: './facsimiles.component.html',
  styleUrl: './facsimiles.component.scss'
})
export class FacsimilesComponent implements OnInit {

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false, filterType: 'equals' },
    { field: 'title', header: 'Title', filterable: true, type: 'string', editable: true, filterType: 'contains' },
    { field: 'description', header: 'Description', filterable: true, type: 'string', editable: true, filterType: 'contains' },
    { field: 'number_of_pages', header: 'Number of pages', filterable: false, type: 'number', editable: true },
    { field: 'start_page_number', header: 'Start page number', filterable: false, type: 'number', editable: true },
    { field: 'external_url', header: 'External URL', filterable: true, type: 'string', filterType: 'contains', editable: true },
    { field: 'actions', header: 'Actions', filterable: false, type: 'action' },
  ]
  allColumnData = [
    ...this.columnsData,
    { field: 'page_comment', header: 'Page comment', filterable: false, type: 'string', editable: false },
    { field: 'deleted', header: 'Deleted', filterable: false, type: 'boolean', editable: false },
    { field: 'folder_path', header: 'Folder path', filterable: false, type: 'string', editable: false },
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);

  selectedProject$;
  facsimileCollections$: Observable<FacsimileCollection[]> = of([]);
  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  sortParams$;
  filterParams$;

  loading$;
  loadingData = true;

  constructor(
    private facsimileService: FacsimileService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService,
    private router: Router,
  ) {
    this.loading$ = this.loadingService.loading$;
    this.selectedProject$ = this.facsimileService.selectedProject$;
    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;
  }

  ngOnInit() {
    this.facsimileCollections$ = this.loader$.asObservable().pipe(
      switchMap(() => this.selectedProject$.pipe(
        switchMap(project => {
          if (!project) { return of([]); }
          return this.facsimileService.getFacsimileCollections(project);
        })
      )),
    );
  }

  editCollection(collection: FacsimileCollection | null = null) {
    const data: EditDialogData<FacsimileCollection> = {
      model: collection,
      columns: this.allColumnData,
      title: 'fascimile collection'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();

        let request$: Observable<FacsimileCollectionResponse>;
        const currentProject = this.projectService.getCurrentProject();
        if (collection?.id) {
          request$ = this.facsimileService.editFacsimileCollection(collection.id, payload, currentProject);
        } else {
          request$ = this.facsimileService.addFacsimileCollection(payload, currentProject);
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackbar.open('Facsimile collection saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  open(collection: FacsimileCollection) {
    this.router.navigate(['facsimiles', collection.id], { queryParamsHandling: 'preserve'});
  }

  filter() {
    const columns = this.columnsData.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      data: columns
    });
  }

  sort() {
    const columns = this.columnsData.filter(column => column.filterable);
    this.dialog.open(TableSortingComponent, {
      data: columns
    });
  }

  deleteFacsimileCollection(collection: FacsimileCollection) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this facsimile collection?',
        cancelText: 'Cancel',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        const payload = { ...collection, deleted: Deleted.Deleted };
        const currentProject = this.projectService.getCurrentProject();
        this.facsimileService.editFacsimileCollection(collection.id, payload, currentProject).pipe(take(1)).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackbar.open('Facsimile collection deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });

  }

  addFromPublications() {
    this.router.navigate(['/facsimiles/add-from-publications']);
  }

}
