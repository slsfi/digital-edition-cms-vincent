import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, of, take, startWith, debounceTime, catchError, BehaviorSubject, switchMap, shareReplay } from 'rxjs';

import { Keyword, KeywordCreationRequest } from '../../models/keyword.model';
import { Publication, PublicationCollection } from '../../models/publication.model';
import { KeywordService } from '../../services/keyword.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditKeywordDialogComponent } from '../../components/edit-keyword-dialog/edit-keyword-dialog.component';
import { PublicationKeywordTableComponent } from '../../components/publication-keyword-table/publication-keyword-table.component';


@Component({
  selector: 'app-keyword-linking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    PublicationKeywordTableComponent
  ],
  templateUrl: './keyword-linking.component.html',
  styleUrl: './keyword-linking.component.scss'
})
export class KeywordLinkingComponent implements OnInit {
  // Collections and publications
  collections$: Observable<PublicationCollection[]> = of([]);
  publications$: Observable<Publication[]> = of([]);
  selectedCollectionId: number | null = null;
  
  // Keywords
  linkedKeywords$: Observable<Keyword[]> = of([]);
  selectedPublicationId: number | null = null;
  
  // UI state
  isLoading = false;
  hasLoadedOnce = false;
  projectName = '';
  
  // Form controls
  collectionControl = new FormControl<number | null>(null);
  keywordSearchControl = new FormControl('');
  
  // Keyword search
  filteredKeywords$: Observable<Keyword[]> = of([]);
  private currentSearchTerm = ''; // Store the current search term
  
  // Display columns
  keywordColumns: string[] = ['text', 'category', 'actions'];
  
  // Refresh triggers
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private publicationsRefreshTrigger$ = new BehaviorSubject<number | null>(null);

  constructor(
    private keywordService: KeywordService,
    private projectService: ProjectService,
    private publicationService: PublicationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Initialize project name
    const currentProject = this.projectService.getCurrentProject();
    this.projectName = currentProject || '';
    
    this.loadData();
    this.setupCollectionSelection();
    this.setupKeywordSearch();
  }

  loadData() {
    const currentProject = this.projectService.getCurrentProject();
    
    if (currentProject) {
      // Load collections
      this.collections$ = this.publicationService.getPublicationCollections(currentProject).pipe(
        catchError(error => {
          console.error('Error loading collections:', error);
          return of([]);
        }),
        shareReplay(1)
      );
      

      // Set up publications observable with refresh trigger
      this.publications$ = this.publicationsRefreshTrigger$.pipe(
        switchMap(collectionId => {
          if (!collectionId) {
            return of([]);
          }
          return this.publicationService.getPublications(collectionId.toString(), currentProject).pipe(
            catchError(error => {
              console.error('Error loading publications:', error);
              return of([]);
            })
          );
        }),
        shareReplay(1)
      );
    }
  }

  setupCollectionSelection() {
    this.collectionControl.valueChanges.subscribe(collectionId => {
      this.selectedCollectionId = collectionId;
      // Clear the current selection when changing collections
      this.selectedPublicationId = null;
      this.linkedKeywords$ = of([]);
      
      // Trigger publications reload
      this.publicationsRefreshTrigger$.next(collectionId);
    });
  }

  setupKeywordSearch() {
    this.filteredKeywords$ = this.keywordSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(searchTerm => {
        // Store the current search term
        this.currentSearchTerm = searchTerm || '';
        
        if (!searchTerm || searchTerm.length < 2) {
          return of([]);
        }
        
        return this.keywordService.searchKeywords(this.projectName, searchTerm).pipe(
          catchError(error => {
            console.error('Error searching keywords:', error);
            return of([]);
          })
        );
      })
    );
  }


  selectPublication(publication: Publication) {
    this.selectedPublicationId = publication.id;
    this.loadLinkedKeywords(publication.id);
  }

  loadLinkedKeywords(publicationId: number) {
    const currentProject = this.projectService.getCurrentProject();
    if (currentProject) {
      this.linkedKeywords$ = this.keywordService.getKeywordsForPublication(publicationId, currentProject).pipe(
        catchError(error => {
          console.error('Error loading linked keywords:', error);
          return of([]);
        }),
        shareReplay(1)
      );
    }
  }


  removeKeywordFromPublication(keyword: Keyword) {
    if (!this.selectedPublicationId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: `Are you sure you want to remove the keyword "${keyword.name}" from this publication?`,
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
    if (!this.selectedPublicationId) return;

    const currentProject = this.projectService.getCurrentProject();
    if (!currentProject) return;

    this.keywordService.connectKeywordToPublication(keyword.id, this.selectedPublicationId, currentProject).subscribe({
      next: (success) => {
        if (success) {
          this.snackBar.open(`Keyword "${keyword.name}" linked to publication`, 'Close', { duration: 3000 });
          this.loadLinkedKeywords(this.selectedPublicationId!);
        } else {
          this.snackBar.open(`Failed to link keyword "${keyword.name}" - please try again`, 'Close', { duration: 5000 });
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

  private createAndLinkNewKeyword(keywordRequest: KeywordCreationRequest) {
    if (!this.selectedPublicationId) return;

    const currentProject = this.projectService.getCurrentProject();
    if (!currentProject) return;

    // First create the keyword
    const createRequest: KeywordCreationRequest = {
      name: keywordRequest.name,
      category: keywordRequest.category,
      translations: keywordRequest.translations || []
    };

    this.keywordService.createKeyword(createRequest, currentProject).subscribe({
      next: (createdKeyword) => {
        // Then link it to the publication
        this.keywordService.connectKeywordToPublication(createdKeyword.id, this.selectedPublicationId!, currentProject).subscribe({
          next: (linkSuccess) => {
            if (linkSuccess) {
              this.snackBar.open(`Keyword "${createdKeyword.name}" created and linked to publication`, 'Close', { duration: 3000 });
              this.loadLinkedKeywords(this.selectedPublicationId!);
            } else {
              this.snackBar.open(`Keyword "${createdKeyword.name}" created but failed to link - please try linking manually`, 'Close', { duration: 5000 });
            }
          },
          error: (error) => {
            console.error('Error linking new keyword:', error);
            let errorMessage = 'Keyword created but failed to link';
            
            if (error.status === 0 || error.statusText === 'Unknown Error') {
              errorMessage = 'Keyword created but network error prevented linking - please try linking manually';
            } else if (error.status === 404) {
              errorMessage = 'Keyword created but publication not found for linking';
            } else if (error.status === 403) {
              errorMessage = 'Keyword created but permission denied for linking';
            }
            
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          }
        });
      },
      error: (error) => {
        console.error('Error creating keyword:', error);
        let errorMessage = 'Error creating keyword';
        
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          errorMessage = 'Network error creating keyword - please check your connection';
        } else if (error.status === 400) {
          errorMessage = 'Invalid keyword data - please check the keyword text and category';
        } else if (error.status === 409) {
          errorMessage = 'Keyword already exists with this text';
        } else if (error.status >= 500) {
          errorMessage = 'Server error creating keyword - please try again later';
        }
        
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  private performRemoveKeyword(keyword: Keyword) {
    if (!this.selectedPublicationId) return;

    if (!keyword.eventId) {
      this.snackBar.open('Cannot remove keyword: missing event information', 'Close', { 
        panelClass: ['snackbar-error'] 
      });
      return;
    }

    if (!this.projectName) {
      this.snackBar.open('No project selected', 'Close', { 
        panelClass: ['snackbar-error'] 
      });
      return;
    }

    this.isLoading = true;
    this.keywordService.disconnectKeywordFromPublication(keyword.eventId, this.projectName).pipe(take(1)).subscribe({
      next: (success) => {
        if (success) {
          this.snackBar.open('Keyword removed successfully', 'Close', { 
            panelClass: ['snackbar-success'] 
          });
          this.refreshLinkedKeywords();
        } else {
          this.snackBar.open('Failed to remove keyword - please try again', 'Close', { 
            panelClass: ['snackbar-error'] 
          });
        }
      },
      error: (error) => {
        console.error('Failed to remove keyword:', error);
        let errorMessage = 'Failed to remove keyword';
        
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          errorMessage = 'Network error removing keyword - please check your connection';
        } else if (error.status === 404) {
          errorMessage = 'Keyword connection not found';
        } else if (error.status === 403) {
          errorMessage = 'Permission denied - you may not have access to remove keywords';
        } else if (error.status >= 500) {
          errorMessage = 'Server error removing keyword - please try again later';
        }
        
        this.snackBar.open(errorMessage, 'Close', { 
          panelClass: ['snackbar-error'] 
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  refreshLinkedKeywords() {
    if (this.selectedPublicationId) {
      this.loadLinkedKeywords(this.selectedPublicationId);
    }
  }

  refreshData() {
    this.refreshTrigger$.next();
  }

  // Keyword search methods
  displayKeyword(keyword: Keyword): string {
    return keyword ? keyword.name : '';
  }

  private clearSearchFields(): void {
    this.keywordSearchControl.setValue('');
    this.currentSearchTerm = '';
  }

  onKeywordSelected(event: { option: { value: Keyword | null } }): void {
    const value = event.option.value;
    
    if (value === null) {
      // This is the "create new keyword" option
      // Use the stored search term
      this.createNewKeywordFromSearch(this.currentSearchTerm);
    } else if (value && this.selectedPublicationId) {
      // This is a regular keyword
      this.linkExistingKeyword(value);
      this.clearSearchFields();
    }
  }

  createNewKeywordFromSearch(searchTerm: string): void {
    if (!searchTerm) return;

    // Get categories for the dialog
    const categories$ = this.keywordService.getUniqueCategories(this.projectName);

    // Create a temporary keyword object with the search term as the text
    const tempKeyword: Keyword = {
      id: 0, // Temporary ID
      name: searchTerm,
      category: null,
      projectId: 1, // Mock project ID
      translations: []
    };

    // Open the keyword creation dialog with the search term pre-filled
    const keywordDialogRef = this.dialog.open(EditKeywordDialogComponent, {
      data: {
        mode: 'add',
        keyword: tempKeyword, // Pre-fill with search term
        categories$: categories$
      },
      width: '500px'
    });

    keywordDialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedPublicationId) {
        // Create the keyword and then link it to the publication
        this.keywordService.createKeyword(result, this.projectName).pipe(take(1)).subscribe({
          next: (createdKeyword) => {
            this.linkExistingKeyword(createdKeyword);
            this.clearSearchFields();
            this.snackBar.open('Keyword created and linked successfully', 'Close', { 
              panelClass: ['snackbar-success'] 
            });
          },
          error: (error) => {
            console.error('Failed to create keyword:', error);
            this.snackBar.open('Failed to create keyword', 'Close', { 
              panelClass: ['snackbar-error'] 
            });
          }
        });
      }
    });
  }

  // TrackBy functions for performance
  trackByPublication(index: number, publication: Publication): number {
    return publication.id;
  }

  trackByKeyword(index: number, keyword: Keyword): number {
    return keyword.id;
  }
}
