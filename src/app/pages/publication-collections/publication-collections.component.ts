import { LoadingService } from './../../services/loading.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { PublicationCollection } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column, Deleted } from '../../models/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatDialog } from '@angular/material/dialog';
import { PublicationsComponent } from "../../components/publications/publications.component";
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { QueryParamsService } from '../../services/query-params.service';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';
import { MatBadgeModule } from '@angular/material/badge';
import { EditDialogComponent } from '../../components/edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { PublicationService } from '../../services/publication.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'publication-collections',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent,
    PublicationsComponent, MatBadgeModule, CustomTableComponent, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './publication-collections.component.html',
  styleUrl: './publication-collections.component.scss'
})
export class PublicationCollectionsComponent {
  publicationCollectionColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'id', editable: false, filterable: true },
    { field: 'name', header: 'Name', type: 'string', editable: true, filterable: true },
    { field: 'published', header: 'Published', type: 'published', editable: true, filterable: true },
    { field: 'actions', header: 'Actions', type: 'action', editable: false },
  ];
  allPublicationCollectionColumns: Column[] = [
    ...this.publicationCollectionColumnsData,
    {
      field: 'cascade_published',
      header: 'Also apply selected published status to all publications in the collection including any comments, manuscripts or variants linked to the publications.',
      type: 'boolean',
      editable: true
    },
    { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: false },
    { field: 'name_translation_id', header: 'Name Translation ID', type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', type: 'number', editable: false },
  ];
  publicationCollectionDisplayedColumns: string[] = this.publicationCollectionColumnsData.map(column => column.field);
  publicationCollectionsLoader$: Subject<void> = new Subject<void>();

  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();
  private collectionsSource = new BehaviorSubject<PublicationCollection[]>([]);
  publicationCollectionsResult$: Observable<PublicationCollection[]> = this.collectionsSource.asObservable();

  selectedPublicationCollection$: Observable<PublicationCollection | null> = new Observable<PublicationCollection | null>();

  sortParams$: Observable<any[]> = new Observable<any[]>();
  filterParams$: Observable<any[]> = new Observable<any[]>();

  loading$: Observable<boolean> = new Observable<boolean>();

  constructor(
    private publicationService: PublicationService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.loading$ = this.loadingService.loading$;
   }

  ngOnInit() {
    this.selectedProject$ = this.publicationService.selectedProject$;

    this.publicationCollectionId$ = this.route.paramMap.pipe(
      map(params => params.get('collectionId'))
    );

    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;

    const publicationCollectionsShared$ = this.publicationCollectionsLoader$.pipe(
      startWith(void 0),
      switchMap(() => combineLatest([this.selectedProject$, this.publicationService.getPublicationCollections()])),
      map(([project, publications]) => publications),
      shareReplay(1)
    );

    this.publicationCollections$ = publicationCollectionsShared$;

    this.selectedPublicationCollection$ = combineLatest([publicationCollectionsShared$, this.publicationCollectionId$]).pipe(
      filter(([publications, collectionId]) => collectionId != null),
      map(([publications, collectionId]) => publications.find(publication => publication.id === parseInt(collectionId as string)) ?? null)
    );

    this.publicationCollections$.subscribe(publications => {
      this.collectionsSource.next(publications);
    });

  }

  editPublicationCollection(publicationCollection: PublicationCollection | null = null) {
    let columns = this.allPublicationCollectionColumns;
    if (publicationCollection == null) {
      columns = columns.filter(column => column.editable);
    }
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: publicationCollection ?? {},
        columns,
        title: 'Publication Collection'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let req;
        if (publicationCollection?.id) {
          req = this.publicationService.editPublicationCollection(publicationCollection.id, result.form.value);
        } else {
          req = this.publicationService.addPublicationCollection(result.form.value);
        }
        req.subscribe({
          next: () => {
            this.publicationCollectionsLoader$.next();
            this.snackbar.open('Publication Collection saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  deletePublicationCollection(collection: PublicationCollection) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        showCascadeBoolean: true,
        cascadeText: 'Also delete all publications in the collection including any comments, manuscripts or variants linked to the publications.',
        message: 'Are you sure you want to delete this publication collection?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        const payload = { deleted: Deleted.Deleted, cascade_deleted: result.cascadeBoolean };
        this.publicationService.editPublicationCollection(collection.id, payload).subscribe({
          next: () => {
            this.publicationCollectionsLoader$.next();
            this.snackbar.open('Publication collection deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  filter() {
    const columns = this.allPublicationCollectionColumns.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      width: '250px',
      data: columns
    });
  }

  sort() {
    const columns = this.publicationCollectionColumnsData.filter(column => column.field !== 'action');
    this.dialog.open(TableSortingComponent, {
      width: '250px',
      data: columns
    });
  }

}
