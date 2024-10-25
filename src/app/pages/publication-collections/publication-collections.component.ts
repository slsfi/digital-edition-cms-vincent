import { LoadingService } from './../../services/loading.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { PublicationCollection } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column, QueryParamType } from '../../models/column';
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
    { field: 'collection_intro_filename', header: 'Collection Intro Filename', type: 'string', editable: false },
    { field: 'collection_intro_published', header: 'Collection Intro Published', type: 'published', editable: false },
    { field: 'collection_title_filename', header: 'Collection Title Filename', type: 'string', editable: false },
    { field: 'collection_title_published', header: 'Collection Title Published', type: 'published', editable: false },
    { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: false },
    { field: 'name_translation_id', header: 'Name Translation ID', type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', type: 'number', editable: false },
    { field: 'publication_collection_introduction_id', header: 'Publication Collection Introduction ID', type: 'number', editable: false },
    { field: 'title', header: 'Title', type: 'string', editable: false },
  ];
  publicationCollectionDisplayedColumns: string[] = this.publicationCollectionColumnsData.map(column => column.field);
  publicationCollectionsLoader$: Subject<void> = new Subject<void>();

  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();
  filteredPublicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  private collectionsSource = new BehaviorSubject<PublicationCollection[]>([]);
  publicationCollectionsResult$: Observable<PublicationCollection[]> = this.collectionsSource.asObservable();

  allCollectionsAmount: number = 0;
  filteredCollectionsAmount: number = 0;

  selectedPublicationCollection$: Observable<PublicationCollection | null> = new Observable<PublicationCollection | null>();

  sortParams$: Observable<any[]> = new Observable<any[]>();
  filterParams$: Observable<any[]> = new Observable<any[]>();

  loading$: Observable<boolean> = new Observable<boolean>();

  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.loading$ = this.loadingService.loading$;
   }

  ngOnInit() {
    this.selectedProject$ = this.projectService.selectedProject$;

    this.publicationCollectionId$ = this.route.paramMap.pipe(
      map(params => params.get('collectionId'))
    );

    this.sortParams$ = this.queryParamsService.sortParams$;

    this.filterParams$ = this.queryParamsService.filterParams$;

    const publicationCollectionsShared$ = this.publicationCollectionsLoader$.pipe(
      startWith(void 0),
      switchMap(() => combineLatest([this.selectedProject$, this.projectService.getPublicationCollections()])),
      map(([project, publications]) => publications),
      shareReplay(1)
    );

    this.publicationCollections$ = publicationCollectionsShared$;

    this.selectedPublicationCollection$ = combineLatest([publicationCollectionsShared$, this.publicationCollectionId$]).pipe(
      filter(([publications, collectionId]) => collectionId != null),
      map(([publications, collectionId]) => publications.find(publication => publication.id === parseInt(collectionId as string)) ?? null)
    );

    this.filteredPublicationCollections$ = combineLatest([publicationCollectionsShared$, this.route.queryParamMap]).pipe(
      map(([publications, params]) => {
        this.allCollectionsAmount = publications.length;
        const queryParams: QueryParamType = {};

        params.keys.forEach(key => {
          const k = params.get(key);
          if (k) {
            queryParams[key] = k;
          }
        });

        if (queryParams['name']) {
          publications = publications.filter(publication => publication.name.toLowerCase().includes(queryParams['name']));
        }
        if (queryParams['published']) {
          publications = publications.filter(publication => publication.published === parseInt(queryParams['published']));
        }
        if (queryParams['id']) {
          publications = publications.filter(publication => publication.id === parseInt(queryParams['id']));
        }

        this.filteredCollectionsAmount = publications.length;

        let filteredPublications = [...publications];
        if (queryParams['sort'] && queryParams['direction']) {
          filteredPublications = filteredPublications.sort((a: any, b: any) => {
            let aValue = a[queryParams['sort']];
            let bValue = b[queryParams['sort']];
            if (typeof aValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }
            if (queryParams['direction'] === 'asc') {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
        }

        return filteredPublications;
      })
    );

    this.filteredPublicationCollections$.subscribe(publications => {
      this.collectionsSource.next(publications);
    });

  }

  editPublicationCollection(publicationCollection: PublicationCollection | null = null) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: publicationCollection ?? {},
        columns: this.allPublicationCollectionColumns
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable),
        title: 'Publication Collection'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let req;
        if (publicationCollection?.id) {
          req = this.projectService.editPublicationCollection(publicationCollection.id, result.form.value);
        } else {
          req = this.projectService.addPublicationCollection(result.form.value);
        }
        req.subscribe({
          next: () => {
            this.publicationCollectionsLoader$.next();
            this.snackbar.open('Publication Collection saved', 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open('Error saving publication collection', 'Close', { panelClass: ['snackbar-error'] });
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
