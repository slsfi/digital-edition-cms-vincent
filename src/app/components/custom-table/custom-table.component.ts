import { QueryParamsService } from './../../services/query-params.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { IdRoutePipe } from '../../pipes/id-route.pipe';
import { Observable } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'custom-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, RouterLink, MatIconModule, MatButtonModule, CustomDatePipe, IdRoutePipe, ScrollingModule],
  providers: [DatePipe],
  templateUrl: './custom-table.component.html',
  styleUrl: './custom-table.component.scss'
})
export class CustomTableComponent {
  @Input() columns: Column[] = [];
  @Input() data: any[] = [];
  @Input() idRouteParams: string[] = [];
  @Input() showIndex: boolean = true;
  @Input() selectedId: string | null = null;

  @Output() editRow: EventEmitter<any> = new EventEmitter<any>();
  @Output() editRowSecondary: EventEmitter<any> = new EventEmitter<any>();

  displayedColumns: string[] = [];
  editSecondaryUsed: boolean = false;
  tableColumns: Column[] = [];

  queryParams$ = new Observable<any>();

  constructor(private queryParamsService: QueryParamsService) {}

  ngOnInit() {
    this.queryParams$ = this.queryParamsService.queryParams$;
    this.editSecondaryUsed = this.editRowSecondary.observers.length > 0;
    const indexColumn: Column = {field: 'index', header: '#', filterable: false, type: 'index'};
    this.tableColumns = this.showIndex ? [indexColumn, ...this.columns] : [...this.columns];
    this.displayedColumns = this.tableColumns.map(column => column.field);
  }

  edit(model: any) {
    this.editRow.emit(model);
  }

  editSecondary(model: any) {
    this.editRowSecondary.emit(model);
  }
}
