import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { TableOfContentsService } from '../../services/table-of-contents.service';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { TocRoot, TocNode, PublicationSortOption } from '../../models/table-of-contents';
import { PublicationCollection, Publication } from '../../models/publication';
import { TocTreeComponent } from '../../components/toc-tree/toc-tree.component';
import { ConfirmUpdateDialogComponent } from '../../components/confirm-update-dialog/confirm-update-dialog.component';
import { AutoGenerateTocDialogComponent } from '../../components/auto-generate-toc-dialog/auto-generate-toc-dialog.component';

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

  // Publications cache for selected collection
  publicationsForSelectedCollection: Publication[] = [];

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
    this.loadPublicationsForSelectedCollection();
    this.loadTableOfContents();
  }

  private loadPublicationsForSelectedCollection(): void {
    if (!this.selectedCollectionId) {
      this.publicationsForSelectedCollection = [];
      return;
    }
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      this.publicationsForSelectedCollection = [];
      return;
    }
    this.publicationService
      .getPublications(this.selectedCollectionId.toString(), projectName, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (publications) => {
          this.publicationsForSelectedCollection = publications;
        },
        error: () => {
          this.publicationsForSelectedCollection = [];
        }
      });
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
          this.currentToc = null; // Clear previous TOC
          this.hasUnsavedChanges = false; // Reset unsaved changes
          this.isLoading = false;
        }
      });
  }

  saveTableOfContents(): void {
    if (!this.currentToc || !this.selectedCollectionId) {
      return;
    }

    // Clean the TOC data before saving (remove id and isExpanded fields)
    const cleanedToc = this.cleanTocForSaving(this.currentToc);

    this.isSaving = true;
    this.tocService.saveToc(this.selectedCollectionId, cleanedToc)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.hasUnsavedChanges = false;
            this.showSuccess('Table of contents saved successfully');
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

  private cleanTocForSaving(toc: TocRoot): TocRoot {
    const cleanedToc = JSON.parse(JSON.stringify(toc)); // Deep copy
    this.removeDragDropFields(cleanedToc);
    return cleanedToc;
  }

  /**
   * Recursively remove UI-only fields and clean up unnecessary properties from TOC nodes.
   * This method ensures that only relevant data is sent to the backend by:
   * - Removing UI-only fields (id, isExpanded)
   * - Removing type-inappropriate properties (e.g., facsimileOnly from subtitle nodes)
   * - Removing empty/null optional properties to reduce JSON size
   * 
   * @param node - The TOC node or root to clean
   */
  private removeDragDropFields(node: TocRoot | TocNode): void {
    // Remove UI-only fields
    delete (node as TocNode).id;
    delete (node as TocNode).isExpanded;
    
    // Remove unnecessary properties based on node type
    // Default to 'subtitle' if no type is specified (backend compatibility)
    const nodeType = node.type || 'subtitle';
    
    if (nodeType === 'subtitle') {
      // Remove text-node specific properties from subtitle nodes
      delete (node as TocNode).description;
      delete (node as TocNode).date;
      delete (node as TocNode).category;
      delete (node as TocNode).facsimileOnly;
      // Note: itemId is kept for subtitle nodes
      
      // Only include collapsed if it's true (default is false)
      if (!(node as TocNode).collapsed) {
        delete (node as TocNode).collapsed;
      }
    } else if (nodeType === 'est') {
      // Remove subtitle-specific properties from text nodes
      delete (node as TocNode).collapsed;
      
      // Only include facsimileOnly if it's true (default is false)
      if (!(node as TocNode).facsimileOnly) {
        delete (node as TocNode).facsimileOnly;
      }
      
      // Remove empty optional properties
      if (!(node as TocNode).description) {
        delete (node as TocNode).description;
      }
      if (!(node as TocNode).date) {
        delete (node as TocNode).date;
      }
      if (!(node as TocNode).category) {
        delete (node as TocNode).category;
      }
      if (!(node as TocNode).itemId) {
        delete (node as TocNode).itemId;
      }
    }
    
    // Recursively clean children
    if (node.children) {
      node.children.forEach((child: TocNode) => this.removeDragDropFields(child));
    }
  }

  openAutoGenerateDialog(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    const dialogRef = this.dialog.open(AutoGenerateTocDialogComponent, {
      width: '500px',
      data: {
        selectedCollectionId: this.selectedCollectionId,
        selectedSortOption: this.selectedSortOption,
        sortOptions: this.sortOptions
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.generateFlatToc(result.selectedSortOption);
      }
    });
  }

  generateFlatToc(sortOption?: string): void {
    if (!this.selectedCollectionId) {
      return;
    }

    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      this.showError('No project selected. Please select a project first.');
      return;
    }

    this.isGeneratingFlatToc = true;
    
    // Use provided sort option or default
    const sortBy = sortOption || this.selectedSortOption;
    
    // Load publications for the selected collection
    this.publicationService.getPublications(this.selectedCollectionId.toString(), projectName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (publications) => {
          this.currentToc = this.tocService.generateFlatToc(
            this.selectedCollectionId!,
            publications,
            sortBy,
            this.selectedCollection?.name
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
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }
}

