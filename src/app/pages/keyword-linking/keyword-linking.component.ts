import { Component, inject, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOption } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { BehaviorSubject, catchError, combineLatest, debounceTime,
         distinctUntilChanged, finalize, map, Observable, of, shareReplay,
         startWith, switchMap, take, tap, timer } from 'rxjs';

import { Keyword } from '../../models/keyword.model';
import { Publication, PublicationCollection } from '../../models/publication.model';
import { KeywordService } from '../../services/keyword.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditKeywordDialogComponent } from '../../components/edit-keyword-dialog/edit-keyword-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { PublicationKeywordTableComponent } from '../../components/publication-keyword-table/publication-keyword-table.component';
import { IsEmptyStringPipe } from '../../pipes/is-empty-string.pipe';


@Component({
  selector: 'keyword-linking',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
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
    LoadingSpinnerComponent,
    PublicationKeywordTableComponent,
    IsEmptyStringPipe
  ],
  templateUrl: './keyword-linking.component.html',
  styleUrl: './keyword-linking.component.scss'
})
export class KeywordLinkingComponent implements OnInit {
  private readonly keywordService = inject(KeywordService);
  private readonly projectService = inject(ProjectService);
  private readonly publicationService = inject(PublicationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Max initial keyword options in the keyword autocomplete, if max
  // this number of keywords, they are immediately displayed in the
  // autocomplete, if more than this, they are not shown until the user
  // starts typing.
  private static readonly MAX_INITIAL_OPTIONS = 50;

  // Collections and publications
  collections$: Observable<PublicationCollection[]> = of([]);
  publications$: Observable<Publication[]> = of([]);
  selectedCollectionId$: Observable<number | null> = of(null);
  selectedCollectionId: number | null = null;
  
  // Keywords
  allKeywords$: Observable<Keyword[]> = of([]);
  
  // UI state
  projectName = signal<string>(this.projectService.getCurrentProject() ?? '');
  isLoadingPublications = signal<boolean>(true);
  isLoadingKeywords = signal<boolean>(true);

  private isLoadingPublications$ = toObservable(this.isLoadingPublications);
  showLoadingPublications$: Observable<boolean> = this.isLoadingPublications$.pipe(
    switchMap(loading => loading
      ? timer(120).pipe(map(() => true))
      : of(false)
    ),
    startWith(false),
    distinctUntilChanged(),
    shareReplay(1)
  );

  private isLoadingKeywords$ = toObservable(this.isLoadingKeywords);
  showLoadingKeywords$: Observable<boolean> = this.isLoadingKeywords$.pipe(
    switchMap(loading => loading
      ? timer(120).pipe(map(() => true))
      : of(false)
    ),
    startWith(false),
    distinctUntilChanged(),
    shareReplay(1)
  );

  // Form controls
  collectionControl = new FormControl<number | null>({ value: null, disabled: true });
  keywordSearchControl = new FormControl('');
  
  // Keyword search
  filteredKeywords$: Observable<Keyword[]> = of([]);
  private currentSearchTerm = ''; // Store the current search term

  // Display columns
  keywordColumns: string[] = ['name', 'category', 'actions'];

  // Reload triggers
  private readonly keywordsReload$ = new BehaviorSubject<void>(undefined);
  private readonly linkedKeywordsReload$ = new BehaviorSubject<void>(undefined);

  selectedPublicationId = signal<number | null>(null);
  selectedPublicationId$ = toObservable(this.selectedPublicationId).pipe(
    distinctUntilChanged()
  );

  linkedKeywords$: Observable<Keyword[] | null> = of(null);

  ngOnInit() {   
    this.setupDataStreams();
    this.setupKeywordSearch();
  }

  setupDataStreams() {
    const currentProject = this.projectName();
    if (!currentProject) return;

    // Collections
    this.collections$ = this.publicationService.getPublicationCollections(currentProject).pipe(
      tap((collections) => {
        if (collections.length > 0) {
          this.collectionControl.enable();
        } else {
          this.collectionControl.disable();
        }
      }),
      catchError(error => {
        console.error('Error loading collections:', error);
        return of([]);
      }),
      shareReplay(1)
    );

    // Selected collection
    this.selectedCollectionId$ = this.collectionControl.valueChanges.pipe(
      startWith(this.collectionControl.value ?? null),
      distinctUntilChanged()
    );

    // Publications, based on selected collection
    this.publications$ = this.selectedCollectionId$.pipe(
      tap(collectionId => {
        if (collectionId !== null) {
          this.isLoadingPublications.set(true);
        }
        // Set selected collection id and clear any publication selection
        this.selectedCollectionId = collectionId;
        this.selectedPublicationId.set(null);
      }),
      switchMap(collectionId => {
        if (!collectionId) return of([]);
        return this.publicationService.getPublications(
          String(collectionId), currentProject
        ).pipe(
          catchError(err => {
            console.error('Error loading publications:', err);
            return of([]);
          }),
          finalize(() => {
            this.isLoadingPublications.set(false);
          })
        );
      }),
      shareReplay(1)
    );

    // All keywords, refetched whenever keywordsReload$ emits
    this.allKeywords$ = this.keywordsReload$.pipe(
      switchMap(() =>
        this.keywordService.getKeywords(currentProject).pipe(
          catchError(err => {
            console.error('Error loading keywords:', err);
            return of([]);
          })
        )
      ),
      shareReplay(1)
    );

    // Keywords linked to selected publication, refetched whenever either
    // selectedPublicationId$ or linkedKeywordsReload$ emit
    this.linkedKeywords$ = combineLatest([
      this.selectedPublicationId$,
      this.linkedKeywordsReload$
    ]).pipe(
      tap(() => this.isLoadingKeywords.set(true)),
      switchMap(([pubId]) => {
        if (!pubId) {
          // No selection: emit empty and stop loading
          this.isLoadingKeywords.set(false);
          return of(null);
        }
        return this.keywordService.getKeywordsForPublication(pubId, this.projectName()).pipe(
          catchError(err => {
            console.error('Error loading linked keywords:', err);
            return of<Keyword[]>([]);
          }),
          finalize(() => this.isLoadingKeywords.set(false))
        );
      }),
      shareReplay(1)
    );
  }

  setupKeywordSearch() {
    const term$ = this.keywordSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300)
    );

    this.filteredKeywords$ = combineLatest([term$, this.allKeywords$]).pipe(
      map(([rawTerm, all]) => {
        const term = (rawTerm || '').trim();
        this.currentSearchTerm = term;

        // If no search term and total number of keywords is max
        // MAX_INITIAL_OPTIONS, then show all keywords
        if (term === '') {
          return all.length <= KeywordLinkingComponent.MAX_INITIAL_OPTIONS ? all : [];
        }
        if (term.length < 2) return [];

        const low = term.toLowerCase();
        return all.filter(k =>
          k.name.toLowerCase().includes(low) ||
          (k.category && k.category.toLowerCase().includes(low))
        );
      })
    );
  }

  selectPublication(publication: Publication) {
    this.selectedPublicationId.set(publication.id);
  }

  removeKeywordFromPublication(keyword: Keyword) {
    if (!this.selectedPublicationId()) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove keyword from publication',
        message: `Are you sure you want to remove the keyword »${keyword.name}» from this publication?`,
        cancelText: 'Cancel',
        confirmText: 'Remove'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        this.performRemoveKeyword(keyword);
      }
    });
  }

  private linkExistingKeyword(keyword: Keyword) {
    const currentProject = this.projectName();
    const selectedPublicationId = this.selectedPublicationId();
    if (!currentProject || !selectedPublicationId) return;

    this.keywordService.connectKeywordToPublication(
      keyword.id, selectedPublicationId, currentProject
    ).subscribe({
      next: (success) => {
        if (success) {
          this.snackBar.open(`Keyword »${keyword.name}» linked to publication.`, 'Close', { duration: 5000 });
          this.reloadLinkedKeywords();
        } else {
          this.snackBar.open(`Failed to link keyword »${keyword.name}» - please try again.`, 'Close');
        }
      },
      error: (error) => {
        console.error('Error linking keyword:', error);
        let errorMessage = 'Error linking keyword';
        
        // Check for specific error types
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          errorMessage = 'Network error - please check your connection and try again';
        } else if (error.status === 404) {
          errorMessage = 'Keyword or publication not found';
        } else if (error.status === 403) {
          errorMessage = 'Permission denied - you may not have access to link keywords';
        } else if (error.status >= 500) {
          errorMessage = 'Server error - please try again later';
        }
        
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  private performRemoveKeyword(keyword: Keyword) {
    const currentProject = this.projectName();
    const selectedPublicationId = this.selectedPublicationId();
    if (!currentProject || !selectedPublicationId) return;

    if (!keyword.eventId) {
      this.snackBar.open('Cannot remove keyword: missing event information.', 'Close', { 
        panelClass: ['snackbar-error'] 
      });
      return;
    }

    this.keywordService.disconnectKeywordFromPublication(
      keyword.eventId, currentProject
    ).pipe(
      take(1)
    ).subscribe({
      next: (success) => {
        if (success) {
          this.snackBar.open('Keyword removed successfully.', 'Close', { 
            panelClass: ['snackbar-success'] 
          });
          this.reloadLinkedKeywords();
        } else {
          this.snackBar.open('Failed to remove keyword - please try again.', 'Close', { 
            panelClass: ['snackbar-error'] 
          });
        }
      },
      error: (error) => {
        console.error('Failed to remove keyword:', error);
        let errorMessage = 'Failed to remove keyword.';
        
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          errorMessage = 'Network error removing keyword - please check your connection.';
        } else if (error.status === 404) {
          errorMessage = 'Keyword connection not found.';
        } else if (error.status === 403) {
          errorMessage = 'Permission denied - you may not have access to remove keywords.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error removing keyword - please try again later.';
        }
        
        this.snackBar.open(errorMessage, 'Close', { 
          panelClass: ['snackbar-error'] 
        });
      }
    });
  }

  displayKeyword(keyword: Keyword): string {
    return keyword ? keyword.name : '';
  }

  private clearSearchFields(): void {
    this.keywordSearchControl.setValue('');
    this.currentSearchTerm = '';
  }

  private reloadKeywords(): void {
    this.keywordsReload$.next();
  }

  private reloadLinkedKeywords(): void {
    this.linkedKeywordsReload$.next();
  }

  linkOrCreateKeyword(event: { option: MatOption & { value: Keyword | null } }): void {
    const value = event.option.value;
    
    if (value === null) {
      // This is the "create new keyword" option
      // Use the stored search term
      this.createNewKeywordFromSearch(this.currentSearchTerm);
    } else if (value && this.selectedPublicationId()) {
      // This is a regular keyword
      this.linkExistingKeyword(value);
    }

    this.clearSearchFields();

    // ensure the visual "selected" state is cleared in the
    // autocomplete list
    event.option.deselect();
  }

  createNewKeywordFromSearch(searchTerm: string): void {
    if (!searchTerm) return;

    // Get categories for the dialog
    const categories$ = this.keywordService.getUniqueCategories(this.projectName());

    // Create a temporary keyword object with the search term as the text
    const tempKeyword: Keyword = {
      id: 0, // Temporary ID
      name: searchTerm,
      category: null,
      translations: []
    };

    // Open the keyword creation dialog with the search term pre-filled
    const keywordDialogRef = this.dialog.open(EditKeywordDialogComponent, {
      data: {
        mode: 'add',
        keyword: tempKeyword, // Pre-fill with search term
        categories$: categories$
      }
    });

    keywordDialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPublicationId()) {
        // Create the keyword and then link it to the publication
        this.keywordService.createKeyword(result, this.projectName()).pipe(
          take(1)
        ).subscribe({
          next: (createdKeyword) => {
            this.linkExistingKeyword(createdKeyword);
            this.reloadKeywords();
            this.snackBar.open('Keyword created and linked successfully.', 'Close', { 
              panelClass: ['snackbar-success'] 
            });
          },
          error: (error) => {
            console.error('Failed to create keyword:', error);
            this.snackBar.open('Failed to create keyword.', 'Close', { 
              panelClass: ['snackbar-error'] 
            });
          }
        });
      }
    });
  }
}
