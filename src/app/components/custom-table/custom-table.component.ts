import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';

import { Column } from '../../models/common';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { IdRoutePipe } from '../../pipes/id-route.pipe';
import { LoadingService } from '../../services/loading.service';
import { QueryParamsService } from './../../services/query-params.service';

@Component({
  selector: 'custom-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, RouterLink, MatIconModule, MatButtonModule, CustomDatePipe, IdRoutePipe,
    ScrollingModule, MatPaginatorModule, MatCheckboxModule
  ],
  providers: [DatePipe],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent<T> implements OnInit, AfterViewInit, OnDestroy {
  @Input() columns: Column[] = [];
  @Input() data$: Observable<T[]> = new BehaviorSubject<T[]>([]);
  @Input() idRouteParams: string[] = [];
  @Input() preserveQueryParams = false;
  @Input() showIndex = true;
  @Input() selectedId: string | null = null;
  @Input() loadingData = false;
  @Input() selectable = false;
  @Input() paginationEnabled = true;
  @Input() disableSortAndFilter = false;

  @Output() editRow: EventEmitter<T> = new EventEmitter<T>();
  @Output() editRowSecondary: EventEmitter<T> = new EventEmitter<T>();
  @Output() openRow: EventEmitter<T> = new EventEmitter<T>();
  @Output() selectRow: EventEmitter<T[]> = new EventEmitter<T[]>();
  @Output() deleteRow: EventEmitter<T> = new EventEmitter<T>();

  private destroy$ = new Subject<void>();
  private wasSortingActive = false; // flag to check whether sorting was previously active

  displayedColumns: string[] = [];
  editSecondaryUsed = false;
  openUsed = false;
  deleteUsed = false;
  tableColumns: Column[] = [];
  originalColumns: Column[] = [];

  tableDataSource = new MatTableDataSource<T>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  queryParams$;
  pageParams$;
  loading$;

  originalData: T[] = [];
  originalCount = 0;
  filteredCount = 0;
  selection: SelectionModel<T> = new SelectionModel<T>(false, []);

  constructor(
    private queryParamsService: QueryParamsService,
    private loadingService: LoadingService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.queryParams$ = this.queryParamsService.queryParams$;
    this.pageParams$ = this.queryParamsService.pageParams$;
  }

  ngOnInit() {
    this.editSecondaryUsed = this.editRowSecondary.observed;
    this.deleteUsed = this.deleteRow.observed;
    this.openUsed = this.openRow.observed;
    this.originalColumns = this.columns;
    const indexColumn: Column = { field: 'index', header: '#', filterable: false, type: 'index' };
    const columns = this.columns.filter(column => column.visible !== false);
    this.tableColumns = this.showIndex ? [indexColumn, ...columns] : [...columns];
    this.displayedColumns = this.tableColumns.map(column => column.field);
    if (this.selectable) {
      this.displayedColumns = ['select', ...this.displayedColumns];
    }

    // Subscribe to the data stream and store the original data
    this.data$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.originalData = [...data]; // Create a copy of the data for resetting
      this.originalCount = data.length;
    });

    // Subscribe to data stream and queryParams for filtering and sorting of data
    combineLatest([this.data$, this.queryParams$]).pipe(
      takeUntil(this.destroy$),
      map(([data, queryParams]) => {
        // Filtering logic
        if (!this.disableSortAndFilter) {
          const filterableColumns = this.originalColumns.filter(column => column.filterable);
          filterableColumns.forEach(column => {
            const field = column.field;
            const filterType = column.filterType ?? 'equals';
            if (queryParams[field]) {
              data = data.filter((item: T) => {
                const value = this.getProperty<T, keyof T>(item, field as keyof T);
                if (typeof value === 'string') {
                  if (filterType === 'contains') {
                    return value.toLowerCase().includes(queryParams[field]);
                  } else {
                    return value.toLowerCase() === queryParams[field];
                  }
                } else {
                  if (typeof value === 'number') {
                    return value === Number(queryParams[field]);
                  }
                  return value === queryParams[field];
                }
              });
            }
          });
        }
        this.filteredCount = data.length;

        // Sorting logic
        if (!this.disableSortAndFilter && queryParams['sort'] && queryParams['direction']) {
          data = data.sort((a: T, b: T) => {
            let aValue = this.getProperty<T, keyof T>(a, queryParams['sort']);
            let bValue = this.getProperty<T, keyof T>(b, queryParams['sort']);
            if (typeof aValue as string === 'string') {
              aValue = (aValue as string).toLowerCase() as T[keyof T];
            }
            if (typeof bValue === 'string') {
              bValue = (bValue as string).toLowerCase() as T[keyof T];
            }
            if (queryParams['direction'] === 'asc') {
              return aValue > bValue ? 1 : -1;
            } else {
              return aValue < bValue ? 1 : -1;
            }
          });
          this.wasSortingActive = true; // Mark sorting as active
        } else if (this.wasSortingActive && !queryParams['sort'] && !queryParams['direction']) {
          // Reset to original order if no sorting params are present anymore
          data = [...this.originalData];
          this.wasSortingActive = false; // Reset the sorting state
        }

        return data;
      })
    ).subscribe(data => {
      // Set paginator page index
      const pageNumber = this.queryParamsService.getPageNumber() ?? 1;
      if (pageNumber && this.tableDataSource.paginator) {
        this.tableDataSource.paginator.pageIndex = Number(pageNumber) - 1;
      }
      // Set data to table
      this.tableDataSource.data = data;
    });
  }

  ngAfterViewInit() {
    if (this.paginationEnabled) {
      this.tableDataSource.paginator = this.paginator;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
    return obj[key];
  }

  edit(model: T) {
    this.editRow.emit(model);
  }

  editSecondary(model: T) {
    this.editRowSecondary.emit(model);
  }

  open(model: T) {
    this.openRow.emit(model);
  }

  selectionChanged(row: T) {
    this.selection.toggle(row);
    this.selectRow.emit(this.selection.selected);
  }

  delete(model: T) {
    this.deleteRow.emit(model);
  }

  pageChanged(event: PageEvent) {
    this.queryParamsService.addQueryParams({ page: (event.pageIndex + 1).toString() });
  }
}
