import { QueryParamsService } from './../../services/query-params.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/common';
import { IdRoutePipe } from '../../pipes/id-route.pipe';
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
export class CustomTableComponent {
  @Input() columns: Column[] = [];
  @Input() data$: Observable<any> = new BehaviorSubject<any>([]);
  @Input() idRouteParams: string[] = [];
  @Input() showIndex: boolean = true;
  @Input() selectedId: string | null = null;
  @Input() loadingData = false;
  @Input() selectable = false;
  @Input() paginationEnabled = true;

  @Output() editRow: EventEmitter<any> = new EventEmitter<any>();
  @Output() editRowSecondary: EventEmitter<any> = new EventEmitter<any>();
  @Output() openRow: EventEmitter<any> = new EventEmitter<any>();
  @Output() selectRow: EventEmitter<any> = new EventEmitter<any>();
  @Output() deleteRow: EventEmitter<any> = new EventEmitter<any>();

  private destroy$ = new Subject<void>();

  displayedColumns: string[] = [];
  editSecondaryUsed: boolean = false;
  openUsed: boolean = false;
  deleteUsed: boolean = false;
  tableColumns: Column[] = [];

  tableDataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  queryParams$ = new Observable<any>();
  loading$: Observable<boolean> = new Observable<boolean>();

  originalCount: number = 0;
  filteredCount: number = 0;
  selection: SelectionModel<any> = new SelectionModel<any>(false, []);

  constructor(private queryParamsService: QueryParamsService, private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit() {
    this.queryParams$ = this.queryParamsService.queryParams$;
    this.editSecondaryUsed = this.editRowSecondary.observers.length > 0;
    this.deleteUsed = this.deleteRow.observers.length > 0;
    this.openUsed = this.openRow.observers.length > 0;
    const indexColumn: Column = {field: 'index', header: '#', filterable: false, type: 'index'};
    this.tableColumns = this.showIndex ? [indexColumn, ...this.columns] : [...this.columns];
    this.displayedColumns = this.tableColumns.map(column => column.field);
    if (this.selectable) {
      this.displayedColumns = ['select', ...this.displayedColumns];
    }
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
            const filterableColumns = this.tableColumns.filter(column => column.filterable);
            filterableColumns.forEach(column => {
              const field = column.field;
              const filterType = column.filterType ?? 'equals';
              if (queryParams[field]) {
                data = data.filter((item: any) => {
                  const value = item[field];
                  if (typeof value === 'string') {
                    return value.toLowerCase().includes(queryParams[field]);
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
              data = data.sort((a: any, b: any) => {
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
            return data;
          })
        ).subscribe(data => {
          this.tableDataSource.data = data;
        });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  edit(model: any) {
    this.editRow.emit(model);
  }

  editSecondary(model: any) {
    this.editRowSecondary.emit(model);
  }

  open(model: any) {
    this.openRow.emit(model);
  }

  selectionChanged(row: any) {
    this.selection.toggle(row);
    this.selectRow.emit(this.selection.selected);
  }

  delete(model: any) {
    this.deleteRow.emit(model);
  }
}
