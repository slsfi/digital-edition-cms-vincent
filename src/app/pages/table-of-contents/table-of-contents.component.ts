import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil, combineLatest } from 'rxjs';

import { TableOfContentsService } from '../../services/table-of-contents.service';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { TocRoot, PublicationSortOption } from '../../models/table-of-contents';
import { PublicationCollection } from '../../models/publication';
import { TocTreeComponent } from '../../components/toc-tree/toc-tree.component';

@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    TocTreeComponent
  ],
  templateUrl: './table-of-contents.component.html',
  styleUrls: ['./table-of-contents.component.scss']
})
export class TableOfContentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Collections
  collections: PublicationCollection[] = [];
  selectedCollection: PublicationCollection | null = null;
  selectedCollectionId: number | null = null;

  // Table of Contents
  currentToc: TocRoot | null = null;
  isLoading = false;
  isSaving = false;
  hasUnsavedChanges = false;

  // Auto-generation
  sortOptions: PublicationSortOption[] = [];
  selectedSortOption = 'id';
  isGeneratingFlatToc = false;

  // Data sync
  isUpdatingFromDb = false;
  updateFields = ['text', 'date'];

  constructor(
    private tocService: TableOfContentsService,
    private publicationService: PublicationService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Get sort options
    this.sortOptions = this.tocService.getSortOptions();

    // Load collections
    this.loadCollections();

    // Subscribe to current TOC changes
    this.tocService.getCurrentToc();
    this.hasUnsavedChanges = this.tocService.hasUnsavedChanges();
  }

  private loadCollections(): void {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      this.showError('No project selected. Please select a project first.');
      return;
    }
    
    this.publicationService.getPublicationCollections(projectName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (collections) => {
          this.collections = collections;
        },
        error: (error) => {
          console.error('Error loading collections:', error);
          this.showError('Failed to load collections');
        }
      });
  }

  onCollectionSelected(collection: PublicationCollection): void {
    this.selectedCollection = collection;
    this.selectedCollectionId = collection.id;
    this.loadTableOfContents();
  }

  loadTableOfContents(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    this.isLoading = true;
    this.tocService.loadToc(this.selectedCollectionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (toc) => {
          this.currentToc = toc;
          this.hasUnsavedChanges = false;
          this.isLoading = false;
          
        },
        error: (error) => {
          console.error('Error loading table of contents:', error);
          this.showError('Failed to load table of contents');
          this.isLoading = false;
        }
      });
  }

  saveTableOfContents(): void {
    if (!this.currentToc || !this.selectedCollectionId) {
      return;
    }


    this.isSaving = true;
    this.tocService.saveToc(this.selectedCollectionId, this.currentToc)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.hasUnsavedChanges = false;
            this.showSuccess('Table of contents saved successfully');
            console.log('TOC saved successfully');
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error saving table of contents:', error);
          this.showError('Failed to save table of contents');
          this.isSaving = false;
        }
      });
  }

  generateFlatToc(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      this.showError('No project selected. Please select a project first.');
      return;
    }

    this.isGeneratingFlatToc = true;
    
    // Load publications for the selected collection
    this.publicationService.getPublications(this.selectedCollectionId.toString(), projectName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (publications) => {
          this.currentToc = this.tocService.generateFlatToc(
            this.selectedCollectionId!,
            publications,
            this.selectedSortOption
          );
          this.hasUnsavedChanges = true;
          this.isGeneratingFlatToc = false;
          this.showSuccess('Flat table of contents generated');
        },
        error: (error) => {
          console.error('Error loading publications:', error);
          this.showError('Failed to load publications for auto-generation');
          this.isGeneratingFlatToc = false;
        }
      });
  }

  updateFromDatabase(): void {
    if (!this.selectedCollectionId || this.hasUnsavedChanges) {
      this.showError('Please save your changes before updating from database');
      return;
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmUpdateDialogComponent, {
      data: {
        title: 'Update from Database',
        message: 'This will replace the current table of contents data with fresh publication data from the database. Continue?',
        confirmText: 'Update',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDatabaseUpdate();
      }
    });
  }

  private performDatabaseUpdate(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    this.isUpdatingFromDb = true;
    this.tocService.updateTocWithPublicationData(this.selectedCollectionId, this.updateFields)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedToc) => {
          this.currentToc = updatedToc;
          this.hasUnsavedChanges = true;
          this.isUpdatingFromDb = false;
          this.showSuccess('Table of contents updated with fresh publication data');
        },
        error: (error) => {
          console.error('Error updating from database:', error);
          this.showError('Failed to update table of contents from database');
          this.isUpdatingFromDb = false;
        }
      });
  }

  onTocChanged(): void {
    this.hasUnsavedChanges = true;
    this.tocService.markAsChanged();
    
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}

// Simple confirmation dialog component
@Component({
  selector: 'app-confirm-update-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText }}</button>
      <button mat-button [mat-dialog-close]="true" color="primary">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmUpdateDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
