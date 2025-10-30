import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, OnInit, output, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';

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
    MatSortModule,
    MatTableModule,
    IsEmptyStringPipe
  ],
  templateUrl: './publication-keyword-table.component.html',
  styleUrl: './publication-keyword-table.component.scss'
})
export class PublicationKeywordTableComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  publications = input<Publication[] | null>(null);
  selectedId = input<number | null>(null);
  rowClick = output<Publication>();

  matPaginator = viewChild<MatPaginator>(MatPaginator);
  matSort = viewChild<MatSort>(MatSort);

  displayedColumns: string[] = ['index', 'id', 'name'];
  dataSource = new MatTableDataSource<Publication>([]);
  searchControl = new FormControl<string>({ value: '', disabled: true });

  constructor() {
    // Update table data when input publications change
    effect(() => {
      const publications = this.publications() ?? [];
      this.dataSource.data = publications;

      if (publications.length) {
        this.searchControl.enable();
      } else {
        this.searchControl.disable();
      }
    });
  }

  ngOnInit(): void {
    const paginator = this.matPaginator();
    const sort = this.matSort();

    if (paginator) {
      this.dataSource.paginator = paginator;
    }
    if (sort) {
      this.dataSource.sort = sort;
    }

    // Simple client-side search by name or id
    this.dataSource.filterPredicate = (data: Publication, filter: string) => {
      const term = (filter || '').trim().toLowerCase();
      if (!term) return true;
      const name = (data.name || '').toLowerCase();
      const id = String(data.id);
      return name.includes(term) || id.includes(term);
    };

    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value || ''),
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.dataSource.filter = (value || '').trim().toLowerCase();

      const paginator = this.matPaginator();
      if (paginator) {
        paginator?.firstPage();
      }
    });
  }

  onRowClick(row: Publication) {
    this.rowClick.emit(row);
  }
}
