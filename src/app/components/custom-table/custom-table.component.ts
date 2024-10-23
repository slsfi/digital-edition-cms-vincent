import { QueryParamsService } from './../../services/query-params.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { IdRoutePipe } from '../../pipes/id-route.pipe';
import { BehaviorSubject, Observable } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { LoadingService } from '../../services/loading.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'custom-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, RouterLink, MatIconModule, MatButtonModule, CustomDatePipe, IdRoutePipe,
    ScrollingModule, MatPaginatorModule, LoadingSpinnerComponent
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

  @Output() editRow: EventEmitter<any> = new EventEmitter<any>();
  @Output() editRowSecondary: EventEmitter<any> = new EventEmitter<any>();

  displayedColumns: string[] = [];
  editSecondaryUsed: boolean = false;
  tableColumns: Column[] = [];

  tableDataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  queryParams$ = new Observable<any>();
  loading$: Observable<boolean> = new Observable<boolean>();

  constructor(private queryParamsService: QueryParamsService, private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }

  ngOnInit() {
    this.queryParams$ = this.queryParamsService.queryParams$;
    this.editSecondaryUsed = this.editRowSecondary.observers.length > 0;
    const indexColumn: Column = {field: 'index', header: '#', filterable: false, type: 'index'};
    this.tableColumns = this.showIndex ? [indexColumn, ...this.columns] : [...this.columns];
    this.displayedColumns = this.tableColumns.map(column => column.field);
  }

  ngAfterViewInit() {
    this.tableDataSource.paginator = this.paginator;
    this.data$.subscribe(data => {
      this.tableDataSource.data = data;
    });
  }

  edit(model: any) {
    this.editRow.emit(model);
  }

  editSecondary(model: any) {
    this.editRowSecondary.emit(model);
  }
}
