import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { Observable, of, take, combineLatest, startWith, map, debounceTime, catchError, BehaviorSubject, switchMap, shareReplay } from 'rxjs';

import { Keyword, KeywordCreationRequest, KeywordUpdateRequest, KeywordTranslation } from '../../models/keyword';
import { KeywordService } from '../../services/keyword.service';
import { ProjectService } from '../../services/project.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { KeywordDialogComponent } from '../../components/keyword-dialog/keyword-dialog.component';

@Component({
  selector: 'app-keywords-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './keywords-management.component.html',
  styleUrl: './keywords-management.component.scss'
})
export class KeywordsManagementComponent implements OnInit {
  keywords$: Observable<Keyword[]> = of([]);
  filteredKeywords$: Observable<Keyword[]> = of([]);
  categories$: Observable<string[]> = of([]);
  isLoading = false;
  displayedColumns: string[] = ['text', 'category', 'translations', 'actions'];
  
  // Search and filter controls
  searchControl = new FormControl('');
  categoryFilterControl = new FormControl('');
  
  // Template optimization properties
  hasFilters = false;
  hasLoadedOnce = false;
  
  // Refresh trigger for reactive updates
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  constructor(
    private keywordService: KeywordService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
    this.setupFiltering();
  }

  loadData() {
    const currentProject = this.projectService.getCurrentProject();
    console.log('Current project from service:', currentProject);
    
    if (currentProject) {
      // Project service returns project name as string, pass it directly to the service
      console.log('Loading keywords for project:', currentProject);
      
      // Load keywords with refresh trigger
      this.keywords$ = this.refreshTrigger$.pipe(
        switchMap(() => {
          this.isLoading = true;
          console.log('Loading keywords for project:', currentProject);
          return this.keywordService.getKeywords(currentProject).pipe(
            map(keywords => {
              this.isLoading = false;
              this.hasLoadedOnce = true;
              console.log('Keywords loaded successfully:', keywords.length, 'keywords');
              return keywords;
            }),
            catchError(error => {
              this.isLoading = false;
              this.hasLoadedOnce = true;
              console.error('Error loading keywords:', error);
              return of([]);
            })
          );
        }),
        shareReplay(1) // Share the result to prevent multiple API calls
      );
      
      // Extract categories from keywords to avoid separate API call
      this.categories$ = this.keywords$.pipe(
        map(keywords => {
          const categories = keywords
            .map(k => k.category)
            .filter((cat): cat is string => cat !== null && cat !== undefined && cat.trim() !== '');
          return [...new Set(categories)].sort();
        }),
        shareReplay(1) // Share the result to prevent multiple subscriptions
      );
    }
  }

  refreshData() {
    this.refreshTrigger$.next();
  }


  setupFiltering() {
    this.filteredKeywords$ = combineLatest([
      this.keywords$,
      this.searchControl.valueChanges.pipe(
        startWith(''),
        // Debounce search input to avoid excessive filtering
        debounceTime(300)
      ),
      this.categoryFilterControl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([keywords, searchTerm, categoryFilter]) => {
        console.log('Filtering setup - keywords:', keywords.length, 'searchTerm:', searchTerm, 'categoryFilter:', categoryFilter);
        
        // Update template optimization properties
        this.hasFilters = !!(searchTerm?.trim() || categoryFilter);
        
        // Early return if no filters applied
        if (!this.hasFilters) {
          console.log('No filters applied, returning all keywords:', keywords.length);
          return keywords;
        }

        let filtered = keywords;

        // Filter by category first (more efficient)
        if (categoryFilter && categoryFilter !== '') {
          filtered = filtered.filter(keyword => keyword.category === categoryFilter);
        }

        // Then filter by search term
        if (searchTerm && searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          filtered = filtered.filter(keyword =>
            keyword.text.toLowerCase().includes(term) ||
            (keyword.category && keyword.category.toLowerCase().includes(term))
          );
        }

        return filtered;
      }),
      shareReplay(1) // Share the result to prevent multiple subscriptions
    );
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.categoryFilterControl.setValue('');
  }

  addKeyword() {
    const dialogRef = this.dialog.open(KeywordDialogComponent, {
      width: '600px',
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
      width: '600px',
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
        message: `Are you sure you want to delete the keyword "${keyword.text}"?`,
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
    const currentProject = this.projectService.getCurrentProject();
    if (!currentProject) {
      this.snackbar.open('No project selected', 'Close', { 
        panelClass: ['snackbar-error'] 
      });
      return;
    }
    
    this.isLoading = true;
    this.keywordService.createKeyword(data, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.snackbar.open('Keyword created successfully', 'Close', { 
          panelClass: ['snackbar-success'] 
        });
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to create keyword:', error);
        this.snackbar.open('Failed to create keyword', 'Close', { 
          panelClass: ['snackbar-error'] 
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private updateKeyword(data: KeywordUpdateRequest) {
    const currentProject = this.projectService.getCurrentProject();
    if (!currentProject) {
      this.snackbar.open('No project selected', 'Close', { 
        panelClass: ['snackbar-error'] 
      });
      return;
    }
    
    this.isLoading = true;
    this.keywordService.updateKeyword(data, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.snackbar.open('Keyword updated successfully', 'Close', { 
          panelClass: ['snackbar-success'] 
        });
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to update keyword:', error);
        this.snackbar.open('Failed to update keyword', 'Close', { 
          panelClass: ['snackbar-error'] 
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private performDelete(keywordId: number) {
    const currentProject = this.projectService.getCurrentProject();
    if (!currentProject) {
      this.snackbar.open('No project selected', 'Close', { 
        panelClass: ['snackbar-error'] 
      });
      return;
    }
    
    this.isLoading = true;
    this.keywordService.deleteKeyword(keywordId, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.snackbar.open('Keyword deleted successfully', 'Close', { 
          panelClass: ['snackbar-success'] 
        });
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to delete keyword:', error);
        this.snackbar.open('Failed to delete keyword', 'Close', { 
          panelClass: ['snackbar-error'] 
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getCategoryDisplay(category: string | null): string {
    return category || 'No category';
  }

  getTranslationsDisplay(translations: KeywordTranslation[]): string {
    if (!translations || translations.length === 0) {
      return 'No translations';
    }
    return translations.map(t => `${t.language}: ${t.text}`).join(', ');
  }

  // Optimized methods for template performance
  hasTranslations(translations: KeywordTranslation[]): boolean {
    return translations && translations.length > 0;
  }

  getTranslationText(translation: KeywordTranslation): string {
    return `${translation.language}: ${translation.text}`;
  }

  // TrackBy functions for performance optimization
  trackByKeyword(index: number, keyword: Keyword): number {
    return keyword.id;
  }

  trackByTranslation(index: number, translation: KeywordTranslation): string {
    return `${translation.language}-${translation.text}`;
  }
}
