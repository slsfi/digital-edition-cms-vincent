import { ChangeDetectionStrategy, Component, inject, OnInit,
         signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { BehaviorSubject, catchError, combineLatest, debounceTime,
         distinctUntilChanged, map, Observable, of, shareReplay,
         startWith, switchMap, take } from 'rxjs';

import { Keyword, KeywordCreationRequest, KeywordUpdateRequest } from '../../models/keyword.model';
import { KeywordService } from '../../services/keyword.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { QueryParamsService } from '../../services/query-params.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { KeywordDialogComponent } from '../../components/keyword-dialog/keyword-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { IsEmptyStringPipe } from '../../pipes/is-empty-string.pipe';
import { Column } from '../../models/common.model';


type Filters = { search: FormControl<string>; category: FormControl<string> };

@Component({
  selector: 'keywords',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    CustomTableComponent,
    LoadingSpinnerComponent,
    IsEmptyStringPipe
  ],
  templateUrl: './keywords.component.html',
  styleUrl: './keywords.component.scss'
})
export class KeywordsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly keywordService = inject(KeywordService);
  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly queryParamsService = inject(QueryParamsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  keywords$: Observable<Keyword[]> = of([]);
  filteredKeywords$: Observable<Keyword[]> = of([]);
  categories$: Observable<string[]> = of([]);
  loading$ = this.loadingService.loading$;

  // Search and filter controls
  // One FormGroup for both filters (non-nullable via control options)
  filters = this.fb.group<Filters>({
    search: this.fb.control('', { nonNullable: true }),
    category: this.fb.control('', { nonNullable: true })
  });

  get searchCtrl() { return this.filters.controls.search; }
  get categoryCtrl() { return this.filters.controls.category; }
  
  hasFilters = signal(false);
  projectName = signal<string | null>(this.projectService.getCurrentProject());
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  keywordColumnsData: Column[] = [
    { field: 'name', header: 'Keyword', type: 'string' },
    { field: 'category', header: 'Category', type: 'category' },
    { field: 'actions', header: 'Actions', type: 'action' }
  ];

  ngOnInit() {
    const currentProject = this.projectName();

    // Keywords stream
    this.keywords$ = this.refreshTrigger$.pipe(
      switchMap(() => currentProject
        ? this.keywordService.getKeywords(currentProject)
        : of([])
      ),
      catchError(error => {
        console.error('Error loading keywords:', error);
        this.showError(error.error.message || error.message || 'Unexpected error loading keywords.');
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }) // Share the same result to all subscribers
    );

    // Categories stream - extract from keywords to avoid separate API call
    this.categories$ = this.keywords$.pipe(
      map(ks => this.keywordService.extractCategoriesFromKeywords(ks)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.setupFiltering();
  }

  refreshData() {
    this.refreshTrigger$.next();
  }

  setupFiltering() {
    const search$ = this.searchCtrl.valueChanges.pipe(
      startWith(this.searchCtrl.value),
      map(v => (v ?? '').trim().toLowerCase()),
      debounceTime(300),
      distinctUntilChanged()
    );

    const category$ = this.categoryCtrl.valueChanges.pipe(
      startWith(this.categoryCtrl.value),
      map(v => (v ?? '').trim()),
      distinctUntilChanged()
    );

    this.filteredKeywords$ = combineLatest([
      this.keywords$,
      search$,
      category$
    ]).pipe(
      map(([keywords, search, category]) => {
        console.log('filtering');
        // Clear query params which might include the "page" param
        // for the table
        this.queryParamsService.clearQueryParams();

        const hasFilters = !!(search || category);
        this.hasFilters.set(hasFilters);

        if (!hasFilters) {
          return keywords;
        }

        // Filter by category first (more efficient)
        let filtered = category
          ? keywords.filter(k => (k.category ?? '').trim() === category)
          : keywords;
        
        // Then filter by search term
        if (search) {
          filtered = filtered.filter(k => k.name.toLowerCase().includes(search));
        }

        return filtered;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  clearFilters() {
    this.filters.setValue({ search: '', category: '' });
  }

  clearSearchControl() {
    this.searchCtrl.setValue('');
  }

  addKeyword() {
    const dialogRef = this.dialog.open(KeywordDialogComponent, {
      data: { mode: 'add', categories$: this.categories$ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createKeyword(result);
      }
    });
  }

  editKeyword(keyword: Keyword) {
    const dialogRef = this.dialog.open(KeywordDialogComponent, {
      data: { mode: 'edit', keyword, categories$: this.categories$ }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateKeyword(result);
      }
    });
  }

  deleteKeyword(keyword: Keyword) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to delete the keyword »${keyword.name}»?`,
        cancelText: 'Cancel',
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        this.performDelete(keyword.id);
      }
    });
  }

  private createKeyword(data: KeywordCreationRequest) {
    const currentProject = this.projectName();
    if (!currentProject) {
      this.showError('No project selected.');
      return;
    }
    
    this.keywordService.createKeyword(data, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.showSuccess('Keyword created successfully.');
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to create keyword:', error);
        this.showError(error.error.message || error.message || 'Unexpected error loading keywords.');
      }
    });
  }

  private updateKeyword(data: KeywordUpdateRequest) {
    const currentProject = this.projectName();
    if (!currentProject) {
      this.showError('No project selected.');
      return;
    }
    
    this.keywordService.updateKeyword(data, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.showSuccess('Keyword updated successfully.');
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to update keyword:', error);
        this.showError(error.error.message || error.message || 'Unexpected error loading keywords.');
      }
    });
  }

  private performDelete(keywordId: number) {
    const currentProject = this.projectName();
    if (!currentProject) {
      this.showError('No project selected.');
      return;
    }
    
    this.keywordService.deleteKeyword(keywordId, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.showSuccess('Keyword deleted successfully.');
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to delete keyword:', error);
        this.showError(error.error.message || error.message || 'Unexpected error loading keywords.');
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackbar.open(message, 'Close', {
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string): void {
    this.snackbar.open(message, 'Close', {
      duration: undefined,
      panelClass: ['snackbar-error']
    });
  }
}
