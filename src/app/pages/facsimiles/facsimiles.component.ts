import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FacsimileCollection, FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest } from '../../models/facsimile';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatTableModule } from '@angular/material/table';
import { Column, QueryParamType } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { QueryParamsService } from '../../services/query-params.service';
import { MatBadgeModule } from '@angular/material/badge';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';
import { EditDialogComponent } from '../../components/edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { LoadingService } from '../../services/loading.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FacsimileCollectionComponent } from '../../components/facsimile-collection/facsimile-collection.component';
import { FacsimileService } from '../../services/facsimile.service';

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
export class FacsimilesComponent {

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false, filterType: 'equals' },
    { field: 'title', header: 'Title', filterable: true, type: 'string', editable: true, filterType: 'contains' },
    { field: 'description', header: 'Description', filterable: true, type: 'string', editable: true, filterType: 'contains' },
    { field: 'number_of_pages', header: 'Number of pages', filterable: false, type: 'number', editable: true },
    // { field: 'page_comment', header: 'Page comment', filterable: false, type: 'string', editable: true },
    { field: 'start_page_number', header: 'Start page number', filterable: false, type: 'number', editable: true },
    { field: 'external_url', header: 'External URL', filterable: true, type: 'string', editable: true },
    // { field: 'folder_path', header: 'Folder path', filterable: false, type: 'string', editable: true },
    { field: 'actions', header: 'Actions', filterable: false, type: 'action' },
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);

  selectedProject$: Observable<string | null> = new Observable<string | null>();
  facsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();
  filteredFacsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();
  private facsimilesSource = new BehaviorSubject<FacsimileCollection[]>([]);
  facsimilesResult$: Observable<FacsimileCollection[]> = this.facsimilesSource.asObservable();

  loader$: Subject<void> = new Subject<void>();
  sortParams$: Observable<QueryParamType[]> = new Observable<QueryParamType[]>();
  filterParams$: Observable<QueryParamType[]> = new Observable<QueryParamType[]>();

  loading$: Observable<boolean> = new Observable<boolean>();
  loadingData = true;

  collectionId$: Observable<string | null> = new Observable<string | null>();
  selectedFacsimileCollection$: Observable<FacsimileCollection | null> = new Observable<FacsimileCollection | null>();

  constructor(
    private facsimileService: FacsimileService,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit() {
    this.collectionId$ = this.route.params.pipe(map(params => params['id']));

    this.selectedProject$ = this.facsimileService.selectedProject$;

    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;

    const facsimileCollectionsShared$ = this.loader$.pipe(
      startWith(0),
      switchMap(() => combineLatest([this.selectedProject$, this.facsimileService.getFacsimileCollections()]).pipe(
        map(([project, facsimiles]) => {
          return facsimiles;
        })
      )),
      shareReplay(1)
    );

    this.facsimileCollections$ = facsimileCollectionsShared$;


    this.facsimileCollections$.subscribe(facsimiles => {
      this.loadingData = false;
      this.facsimilesSource.next(facsimiles);
    });

    this.selectedFacsimileCollection$ = combineLatest([facsimileCollectionsShared$, this.collectionId$]).pipe(
      map(([facsimiles, id]) => {
        return facsimiles.find(facsimile => facsimile.id === parseInt(id as string)) ?? null;
      })
    );

  }

  editCollection(collection: FacsimileCollection | null = null) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        model: collection ?? {},
        columns: this.columnsData.filter(column => column.type != 'action'),
        title: 'Fascimile collection'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        const payload = result.form.value as FacsimileCollectionEditRequest;

        let req;
        if (collection?.id) {
          req = this.facsimileService.editFacsimileCollection(collection.id, payload)
        } else {
          const data: FacsimileCollectionCreateRequest = {
            title: payload.title,
            description: payload.description,
            folderPath: payload.folder_path,
            externalUrl: payload.external_url,
            numberOfPages: payload.number_of_pages,
            startPageNumber: payload.start_page_number,
          };
          req = this.facsimileService.addFacsimileCollection(data);
        }
        req.subscribe({
          next: () => {
            this.loader$.next();
            this.snackbar.open('Facsimile collection saved', 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open('Error editing facsimile collection', 'Close', { panelClass: ['snackbar-error'] });
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
      width: '250px',
      data: columns
    });
  }

  sort() {
    const columns = this.columnsData.filter(column => column.filterable);
    this.dialog.open(TableSortingComponent, {
      width: '250px',
      data: columns
    });
  }

}
