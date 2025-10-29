import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, Observable, startWith, Subject, takeUntil } from 'rxjs';

import { Publication } from '../../models/publication.model';
import { IsEmptyStringPipe } from '../../pipes/is-empty-string.pipe';


@Component({
  selector: 'publication-keyword-table',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    IsEmptyStringPipe
  ],
  templateUrl: './publication-keyword-table.component.html',
  styleUrl: './publication-keyword-table.component.scss'
})
export class PublicationKeywordTableComponent implements OnInit, OnDestroy {
  @Input() publications$: Observable<Publication[]> = new Observable<Publication[]>();
  @Input() selectedId: number | null = null;
  @Input() loading = false;
  @Output() rowClick = new EventEmitter<Publication>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['index', 'id', 'name'];
  dataSource = new MatTableDataSource<Publication>([]);
  searchControl = new FormControl<string>('');

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Bind data stream
    this.publications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(list => {
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

    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value || ''),
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
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
