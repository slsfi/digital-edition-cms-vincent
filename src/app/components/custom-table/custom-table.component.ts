import { QueryParamsService } from './../../services/query-params.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/common';
import { IdRoutePipe } from '../../pipes/id-route.pipe';
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { LoadingService } from '../../services/loading.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'custom-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, RouterLink, MatIconModule, MatButtonModule, CustomDatePipe, IdRoutePipe,
    ScrollingModule, MatPaginatorModule, LoadingSpinnerComponent, MatCheckboxModule
  ],
  providers: [DatePipe],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent<T> implements OnInit, AfterViewInit, OnDestroy {
  @Input() columns: Column[] = [];
  @Input() data$: Observable<T[]> = new BehaviorSubject<T[]>([]);
  @Input() idRouteParams: string[] = [];
  @Input() showIndex = true;
  @Input() selectedId: string | null = null;
  @Input() loadingData = false;
  @Input() selectable = false;
  @Input() paginationEnabled = true;

  @Output() editRow: EventEmitter<T> = new EventEmitter<T>();
  @Output() editRowSecondary: EventEmitter<T> = new EventEmitter<T>();
  @Output() openRow: EventEmitter<T> = new EventEmitter<T>();
  @Output() selectRow: EventEmitter<T[]> = new EventEmitter<T[]>();
  @Output() deleteRow: EventEmitter<T> = new EventEmitter<T>();

  private destroy$ = new Subject<void>();

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

  originalCount = 0;
  filteredCount = 0;
  selection: SelectionModel<T> = new SelectionModel<T>(false, []);

  constructor(private queryParamsService: QueryParamsService, private loadingService: LoadingService) {
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
  }

  getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
    return obj[key];
  }

  ngAfterViewInit() {
    if (this.paginationEnabled) {
      this.tableDataSource.paginator = this.paginator;
    }

    // timeout for handling ExpressionChangedAfterItHasBeenCheckedError
    // and actually it makes table to render faster!
    setTimeout(() => {
      combineLatest([this.data$, this.queryParams$])
        .pipe(
          takeUntil(this.destroy$),
          map(([data, queryParams]) => {
            this.originalCount = data.length;
            // Filtering
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
            this.filteredCount = data.length;

            // Sorting
            if (queryParams['sort'] && queryParams['direction']) {
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
            }
            return data;
          })
        ).subscribe(data => {
          // set paginator page index
          const pageNumber = this.queryParamsService.getPageNumber() ?? 1;
          if (pageNumber && this.tableDataSource.paginator) {
            this.tableDataSource.paginator.pageIndex = Number(pageNumber) - 1;
          }
          // set data to table
          this.tableDataSource.data = data;
        });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
