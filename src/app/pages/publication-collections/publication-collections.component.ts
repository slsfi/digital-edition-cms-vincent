import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, switchMap, take } from 'rxjs';

import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CustomTableComponent } from "../../components/custom-table/custom-table.component";
import { EditDialogComponent, EditDialogData } from '../../components/edit-dialog/edit-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { PublicationsComponent } from "../../components/publications/publications.component";
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';
import { Column, Deleted } from '../../models/common';
import { PublicationCollection, PublicationCollectionResponse } from '../../models/publication';
import { LoadingService } from './../../services/loading.service';
import { PublicationService } from '../../services/publication.service';
import { QueryParamsService } from '../../services/query-params.service';

@Component({
  selector: 'publication-collections',
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent,
    PublicationsComponent, MatBadgeModule, CustomTableComponent, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './publication-collections.component.html',
  styleUrl: './publication-collections.component.scss'
})
export class PublicationCollectionsComponent implements OnInit {
  publicationCollectionColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'id', editable: false, filterable: true },
    { field: 'name', header: 'Name', type: 'string', filterType: 'contains', editable: true, filterable: true, translations: true, parentTranslationField: 'name_translation_id' },
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
    { field: 'date_created', header: 'Date created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date modified', type: 'date', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: false },
    { field: 'name_translation_id', header: 'Name translation ID', type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', type: 'number', editable: false },
  ];
  publicationCollectionDisplayedColumns: string[] = this.publicationCollectionColumnsData.map(column => column.field);
  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  publicationCollections$: Observable<PublicationCollection[]> = of([]);

  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();
  selectedPublicationCollection$: Observable<PublicationCollection | null> = new Observable<PublicationCollection | null>();

  selectedProject$;
  sortParams$;
  filterParams$;
  loading$;

  constructor(
    private publicationService: PublicationService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.selectedProject$ = this.publicationService.selectedProject$;
    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;
   }

  ngOnInit() {
    this.publicationCollectionId$ = this.route.paramMap.pipe(
      map(params => params.get('collectionId'))
    );

    this.publicationCollections$ = this.loader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationService.getPublicationCollections()]).pipe(
        map(([, publications]) => publications)
      )),
    );

    this.selectedPublicationCollection$ = combineLatest([this.publicationCollections$, this.publicationCollectionId$]).pipe(
      filter(([, collectionId]) => collectionId != null),
      map(([publications, collectionId]) => publications.find(publication => publication.id === parseInt(collectionId as string)) ?? null)
    );

  }

  editPublicationCollection(publicationCollection: PublicationCollection | null = null) {
    let columns = this.allPublicationCollectionColumns;
    if (publicationCollection == null) {
      columns = columns.filter(column => column.editable);
    }
    const data: EditDialogData<PublicationCollection> = {
      model: publicationCollection,
      columns,
      title: 'publication collection',
      tableName: 'publication_collection',
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let request$: Observable<PublicationCollectionResponse>;
        if (publicationCollection?.id) {
          request$ = this.publicationService.editPublicationCollection(publicationCollection.id, result.form.value);
        } else {
          request$ = this.publicationService.addPublicationCollection(result.form.value);
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackbar.open('Publication collection saved', 'Close', { panelClass: ['snackbar-success'] });
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
      if (result?.value) {
        const payload = { deleted: Deleted.Deleted, cascade_deleted: result.cascadeBoolean };
        this.publicationService.editPublicationCollection(collection.id, payload).pipe(take(1)).subscribe({
          next: () => {
            this.loader$.next(0);
            this.snackbar.open('Publication collection deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  filter() {
    const columns = this.allPublicationCollectionColumns.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      data: columns
    });
  }

  sort() {
    const columns = this.publicationCollectionColumnsData.filter(column => column.field !== 'action');
    this.dialog.open(TableSortingComponent, {
      data: columns
    });
  }

}
