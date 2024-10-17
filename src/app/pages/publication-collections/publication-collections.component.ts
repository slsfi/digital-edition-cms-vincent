import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounce, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { PublicationCollection } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column, QueryParamType } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EditPublicationCollectionComponent } from '../../components/edit-publication-collection/edit-publication-collection.component';
import { MatDialog } from '@angular/material/dialog';
import { PublicationsComponent } from "../../components/publications/publications.component";
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { QueryParamsService } from '../../services/query-params.service';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'publication-collections',
  standalone: true,
  imports: [CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent, PublicationsComponent, MatBadgeModule],
  providers: [DatePipe],
  templateUrl: './publication-collections.component.html',
  styleUrl: './publication-collections.component.scss'
})
export class PublicationCollectionsComponent {
  publicationCollectionColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number', editable: false, filterable: true },
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
  publicationCollectionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();
  filteredPublicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();

  selectedPublicationCollection$: Observable<PublicationCollection | null> = new Observable<PublicationCollection | null>();

  sortParams$: Observable<any[]> = new Observable<any[]>();
  filterParams$: Observable<any[]> = new Observable<any[]>();

  constructor(private projectService: ProjectService, private dialog: MatDialog, private route: ActivatedRoute, private queryParamsService: QueryParamsService) { }

  ngOnInit() {
    this.selectedProject$ = this.projectService.selectedProject$;

    this.publicationCollectionId$ = this.route.paramMap.pipe(
      map(params => params.get('collectionId'))
    );

    this.sortParams$ = this.queryParamsService.queryParams$.pipe(
      map(params => {
        const sort = params['sort'];
        const direction = params['direction'];
        if (sort && direction) {
          return [{ key: sort, value: direction }];
        }
        return [];
      })
    );

    this.filterParams$ = this.queryParamsService.queryParams$.pipe(
      map(params => {
        const keys = ['name', 'published', 'id'];
        const res: any[] = [];
        Object.entries(params).forEach(([key, value]) => {
          if (keys.includes(key)) {
            const header = this.publicationCollectionColumnsData.find(column => column.field === key)?.header;
            res.push({ key, value, header });
          }
        });
        return res;
      })
    );

    this.publicationCollections$ = this.publicationCollectionsLoader$.asObservable().pipe(
        startWith(null),
        debounce(() => timer(500)),
        switchMap(() => combineLatest([this.selectedProject$, this.projectService.getPublicationCollections()])
          .pipe(map(([project, publications]) => publications)))
    );

    this.selectedPublicationCollection$ = combineLatest([this.publicationCollections$, this.publicationCollectionId$]).pipe(
      filter(([publications, collectionId]) => collectionId != null),
      map(([publications, collectionId]) => publications.find(publication => publication.id === parseInt(collectionId as string)) ?? null)
    );

    this.filteredPublicationCollections$ = combineLatest([this.publicationCollections$, this.route.queryParamMap]).pipe(
      map(([publications, params]) => {
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

        let filteredPublications = [...publications];
        if (queryParams['sort'] && queryParams['direction']) {
          filteredPublications = filteredPublications.sort((a: any, b: any) => {
            if (queryParams['direction'] === 'asc') {
              return a[queryParams['sort']] > b[queryParams['sort']] ? 1 : -1;
            } else {
              return a[queryParams['sort']] < b[queryParams['sort']] ? 1 : -1;
            }
          });
        }

        return filteredPublications;
      })
    );

  }

  editPublicationCollection(publicationCollection: PublicationCollection | null = null) {
    const dialogRef = this.dialog.open(EditPublicationCollectionComponent, {
      width: '400px',
      data: {
        collection: publicationCollection ?? {},
        columns: this.allPublicationCollectionColumns
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.publicationCollectionsLoader$.next(0);
      }
    });
  }

  filter() {
    const columns = this.allPublicationCollectionColumns.filter(column => column.filterable);
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

  sort() {
    const columns = this.publicationCollectionColumnsData.filter(column => column.field !== 'actions');
    const dialogRef = this.dialog.open(TableSortingComponent, {
      width: '250px',
      data: columns
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        console.log('sorting projects');
      }
    });
  }

}
