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
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil, tap } from 'rxjs';

import { Column } from '../../models/common.model';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { IdRoutePipe } from '../../pipes/id-route.pipe';
import { LoadingService } from '../../services/loading.service';
import { QueryParamsService } from './../../services/query-params.service';

@Component({
  selector: 'custom-table',
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
  @Input() extraFilterColumns: Column[] = []; // extra columns that can be filtered by but are not displayed in the table

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
  filterableColumns: Column[] = [];

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
    this.filterableColumns = this.originalColumns.filter(column => column.filterable);

    // Merge in extraFilterColumns to filterable columns (these fields are not displayed in the table)
    // (dedupe by field, extra wins)
    if (this.extraFilterColumns?.length) {
      const byField = new Map<string, Column>(
        this.filterableColumns.map(c => [c.field, c])
      );
      for (const col of this.extraFilterColumns) {
        const prev = byField.get(col.field);
        byField.set(col.field, { ...(prev ?? {} as Column), ...col });
      }
      this.filterableColumns = Array.from(byField.values());
    }

    // Prepare data stream that also updates original data snapshot
    const dataWithOriginal$ = this.data$.pipe(
      tap(data => {
        this.originalData = [...data];
        this.originalCount = data.length;
      })
    );

    // Subscribe to combined stream for filtering and sorting of data
    combineLatest([dataWithOriginal$, this.queryParams$]).pipe(
      takeUntil(this.destroy$),
      map(([data, queryParams]) => {
        // Filtering logic
        if (!this.disableSortAndFilter) {
          this.filterableColumns.forEach((column: Column) => {
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

        // Sorting logic fixed
        if (!this.disableSortAndFilter && queryParams['sort'] && queryParams['direction']) {
          const sortKey = queryParams['sort'] as keyof T;
          const direction = queryParams['direction'] === 'asc' ? 1 : -1;

          data = data.sort((a: T, b: T) => {
            let aValue = this.getProperty<T, keyof T>(a, sortKey) as unknown;
            let bValue = this.getProperty<T, keyof T>(b, sortKey) as unknown;

            // Normalize values: strings → lowercase, null/undefined → null
            const normalize = (v: unknown) => {
              if (v == null) return null;  // null and undefined treated the same
              if (typeof v === 'string') return v.toLowerCase();
              return v;
            };

            const av = normalize(aValue);
            const bv = normalize(bValue);

            // Equal values → stable (don't reorder among themselves)
            if (av === bv) return 0;

            // Consistent placement of "no value"
            // If you want missing values LAST instead, just flip the signs here.
            if (av === null) return -1 * direction;
            if (bv === null) return  1 * direction;

            // Normal comparison (numbers, strings, etc.)
            return av > bv ? 1 * direction : -1 * direction;
          });

          this.wasSortingActive = true;
        } else if (this.wasSortingActive && !queryParams['sort'] && !queryParams['direction']) {
          // Reset to original order if no sorting params are present anymore
          data = [...this.originalData];
          this.wasSortingActive = false;  // Reset the sorting state
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
