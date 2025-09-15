import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, Observable, startWith, Subject, takeUntil } from 'rxjs';

import { Publication } from '../../models/publication';

@Component({
  selector: 'publication-keyword-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './publication-keyword-table.component.html',
  styleUrl: './publication-keyword-table.component.scss'
})
export class PublicationKeywordTableComponent implements OnInit, OnDestroy {
  @Input() publications$: Observable<Publication[]> = new Observable<Publication[]>();
  @Input() selectedId: number | null = null;
  @Input() loading = false;

  @Output() rowClick = new EventEmitter<Publication>();

  displayedColumns: string[] = ['index', 'id', 'name'];
  dataSource = new MatTableDataSource<Publication>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchControl = new FormControl<string>('');
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Bind data stream
    this.publications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        this.dataSource.data = list ?? [];
        // Set up paginator and sort
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      });

    // Simple client-side search by name or id
    this.dataSource.filterPredicate = (data: Publication, filter: string) => {
      const term = (filter || '').trim().toLowerCase();
      if (!term) return true;
      const nameMatch = (data.name || '').toLowerCase().includes(term);
      const idMatch = String(data.id).includes(term);
      return nameMatch || idMatch;
    };

    this.searchControl.valueChanges
      .pipe(startWith(this.searchControl.value || ''), debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.dataSource.filter = (value || '').trim().toLowerCase();
        if (this.paginator) {
          this.paginator.firstPage();
        }
      });
  }

  onRowClick(row: Publication) {
    this.rowClick.emit(row);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


