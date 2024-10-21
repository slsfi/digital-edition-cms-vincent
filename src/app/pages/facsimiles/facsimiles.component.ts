import { Component } from '@angular/core';
import { combineLatest, map, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FacsimileCollection } from '../../models/facsimile';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatTableModule } from '@angular/material/table';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { EditFacsimileComponent } from '../../components/edit-facsimile/edit-facsimile.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { QueryParamsService } from '../../services/query-params.service';
import { MatBadgeModule } from '@angular/material/badge';
import { TableSortingComponent } from '../../components/table-sorting/table-sorting.component';

@Component({
  selector: 'app-facsimiles',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, MatTableModule, MatIconModule, MatButtonModule, ScrollingModule, MatBadgeModule],
  templateUrl: './facsimiles.component.html',
  styleUrl: './facsimiles.component.scss'
})
export class FacsimilesComponent {

  columnsData: Column[] = [
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false },
    { field: 'title', header: 'Title', filterable: true, type: 'string', editable: true,},
    { field: 'description', header: 'Description', filterable: true, type: 'string', editable: true },
    { field: 'number_of_pages', header: 'Number of pages', filterable: false, type: 'number', editable: true },
    { field: 'page_comment', header: 'Page comment', filterable: false, type: 'string', editable: true },
    { field: 'start_page_number', header: 'Start page number', filterable: false, type: 'number', editable: true },
    { field: 'external_url', header: 'External URL', filterable: false, type: 'string', editable: true },
    { field: 'folder_path', header: 'Folder path', filterable: false, type: 'string', editable: true },
    { field: 'actions', header: 'Actions', filterable: false, type: 'actions' },
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);

  selectedProject$: Observable<string | null> = new Observable<string | null>();
  facsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();
  filteredFacsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();

  loader$: Subject<void> = new Subject<void>();
  sortParams$: Observable<{ key: string, value: string }[]> = new Observable<{ key: string, value: string }[]>();
  filterParams$: Observable<{ key: string, value: string, header: string }[]> = new Observable<{ key: string, value: string, header: string }[]>();

  constructor(private projectService: ProjectService, private dialog: MatDialog, private queryParamsService: QueryParamsService) { }

  ngOnInit() {
    this.selectedProject$ = this.projectService.selectedProject$;

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
        const keys = ['title', 'description', 'id'];
        const res: any[] = [];
        Object.entries(params).forEach(([key, value]) => {
          if (keys.includes(key)) {
            const header = this.columnsData.find(column => column.field === key)?.header;
            res.push({ key, value, header });
          }
        });
        return res;
      })
    );

    const facsimileCollectionsShared$ = this.loader$.pipe(
      startWith(0),
      switchMap(() => combineLatest([this.selectedProject$, this.projectService.getFacsimileCollections()]).pipe(
        map(([project, facsimiles]) => {
          return facsimiles;
        })
      )),
      shareReplay(1)
    );

    this.facsimileCollections$ = facsimileCollectionsShared$;

    this.filteredFacsimileCollections$ = combineLatest([facsimileCollectionsShared$, this.queryParamsService.queryParams$]).pipe(
      map(([facsimiles, queryParams]) => {

        if (queryParams['title']) {
          facsimiles = facsimiles.filter(facsimile => facsimile.title.toLowerCase().includes(queryParams['title']));
        }
        if (queryParams['description']) {
          facsimiles = facsimiles.filter(facsimile => facsimile.description?.toLowerCase().includes(queryParams['description']));
        }
        if (queryParams['id']) {
          facsimiles = facsimiles.filter(facsimile => facsimile.id === parseInt(queryParams['id']));
        }

        let filteredFacsimiles = [...facsimiles];
        if (queryParams['sort'] && queryParams['direction']) {
          filteredFacsimiles = filteredFacsimiles.sort((a: any, b: any) => {
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
        return filteredFacsimiles;
      })

    );

  }

  editCollection(collection: FacsimileCollection | null = null) {
    console.log('Edit collection', collection);
    const dialogRef = this.dialog.open(EditFacsimileComponent, {
      data: {
        facsimile: collection ?? {},
        columns: this.columnsData.filter(column => column.type != 'actions')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result) {
        this.loader$.next();
      }
    });
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
