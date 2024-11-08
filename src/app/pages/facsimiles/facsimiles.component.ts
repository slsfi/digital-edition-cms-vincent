import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FacsimileCollection } from '../../models/facsimile';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatTableModule } from '@angular/material/table';
import { Column, Deleted, QueryParamType } from '../../models/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { QueryParamsService } from '../../services/query-params.service';
import { MatBadgeModule } from '@angular/material/badge';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';
import { EditDialogComponent, EditDialogData } from '../../components/edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { LoadingService } from '../../services/loading.service';
import { Router } from '@angular/router';
import { FacsimileCollectionComponent } from '../facsimile-collection/facsimile-collection.component';
import { FacsimileService } from '../../services/facsimile.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-facsimiles',
  standalone: true,
  imports: [
    CommonModule, LoadingSpinnerComponent, MatTableModule, MatIconModule, MatButtonModule, ScrollingModule,
    MatBadgeModule, CustomTableComponent, FacsimileCollectionComponent
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
    { field: 'external_url', header: 'External URL', filterable: true, type: 'string', editable: true },
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
  sortParams$: Observable<QueryParamType[]> = new Observable<QueryParamType[]>();
  filterParams$: Observable<QueryParamType[]> = new Observable<QueryParamType[]>();

  loading$: Observable<boolean> = new Observable<boolean>();
  loadingData = true;

  constructor(
    private facsimileService: FacsimileService,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService,
    private router: Router,
  ) {
    this.loading$ = this.loadingService.loading$;
    this.selectedProject$ = this.facsimileService.selectedProject$;
  }

  ngOnInit() {
    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;

    this.facsimileCollections$ = this.loader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.facsimileService.getFacsimileCollections()]).pipe(
        map(([, facsimiles]) => {
          return facsimiles;
        })
      )),
    );
  }

  editCollection(collection: FacsimileCollection | null = null) {
    const data: EditDialogData<FacsimileCollection> = {
      model: collection,
      columns: this.allColumnData,
      title: 'Fascimile collection'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        const payload = result.form.getRawValue();

        let req;
        if (collection?.id) {
          req = this.facsimileService.editFacsimileCollection(collection.id, payload)
        } else {
          req = this.facsimileService.addFacsimileCollection(payload);
        }
        req.subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackbar.open('Facsimile collection saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  open(collection: FacsimileCollection) {
    this.router.navigate(['facsimiles', collection.id]);
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
        message: 'Are you sure you want to delete this collection?',
        cancelText: 'Cancel',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        const payload = { ...collection, deleted: Deleted.Deleted };
        this.facsimileService.editFacsimileCollection(collection.id, payload).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackbar.open('Facsimile collection deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });

  }

}
