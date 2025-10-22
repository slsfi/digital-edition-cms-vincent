import { Component, inject, OnInit } from '@angular/core';
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
import { map, take } from 'rxjs';

import { TableOfContentsService } from '../../services/table-of-contents.service';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { TocRoot, TocNode, PublicationSortOption } from '../../models/table-of-contents';
import { PublicationCollection, Publication, PublicationLite, toPublicationLite } from '../../models/publication';
import { TocTreeComponent } from '../../components/toc-tree/toc-tree.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { AutoGenerateTocDialogComponent } from '../../components/auto-generate-toc-dialog/auto-generate-toc-dialog.component';

@Component({
  selector: 'toc-management',
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
export class TableOfContentsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly projectService = inject(ProjectService);
  private readonly publicationService = inject(PublicationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tocService = inject(TableOfContentsService);

  projectName: string | null = null;

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
  publicationsForSelectedCollection: PublicationLite[] = [];

  ngOnInit(): void {
    // Get project name
    this.projectName = this.projectService.getCurrentProject();

    // Get sort options
    this.sortOptions = this.tocService.getSortOptions();

    // Load collections
    this.loadCollections(this.projectName);

    // Subscribe to current TOC changes
    this.tocService.getCurrentToc();
    this.hasUnsavedChanges = this.tocService.hasUnsavedChanges();
  }

  private loadCollections(projectName: string | null): void {
    if (!projectName) {
      return;
    }

    this.publicationService.getPublicationCollections(projectName).pipe(
      take(1)
    ).subscribe({
      next: (collections) => {
        this.collections = collections;
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.showError('Failed to load collections.');
      }
    });
  }

  setSelectedCollection(collection: PublicationCollection): void {
    this.selectedCollection = collection;
    this.selectedCollectionId = collection.id;
    this.loadPublicationsForSelectedCollection();
    this.loadTableOfContents();
  }

  private loadPublicationsForSelectedCollection(): void {
    if (!this.projectName || !this.selectedCollectionId) {
      this.publicationsForSelectedCollection = [];
      return;
    }

    this.publicationService.getPublications(
      String(this.selectedCollectionId), this.projectName, true, 'name'
    ).pipe(
      // convert Publication[] -> PublicationLite[]
      map((list: Publication[]) => list.map(toPublicationLite)),
      take(1)
    ).subscribe({
      next: (publications: PublicationLite[]) => {
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
    this.tocService.loadToc(this.selectedCollectionId).pipe(
      take(1)
    ).subscribe({
      next: (toc) => {
        this.currentToc = toc;
        this.hasUnsavedChanges = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading table of contents:', error);
        this.showError('Failed to load table of contents.');
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

    // Clean the TOC data before saving
    const cleanedToc = this.cleanTocForSaving(this.currentToc);

    this.isSaving = true;
    this.tocService.saveToc(this.selectedCollectionId, cleanedToc).pipe(
      take(1)
    ).subscribe({
      next: (success) => {
        if (success) {
          this.hasUnsavedChanges = false;
          this.showSuccess('Table of contents saved successfully.');
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving table of contents:', error);
        this.showError('Failed to save table of contents.');
        this.isSaving = false;
      }
    });
  }

  private cleanTocForSaving(toc: TocRoot): TocRoot {
    const cleanedToc: TocRoot = JSON.parse(JSON.stringify(toc)); // Deep copy

    if (cleanedToc.children) {
      cleanedToc.children.forEach(
        (child: TocNode) => this.normalizeNodeForSaving(child)
      );
    }

    return cleanedToc;
  }

  /**
   * Recursively remove UI-only fields and clean up unnecessary properties
   * from TOC nodes.
   * This method ensures that only relevant data is sent to the backend by:
   * - Removing UI-only fields (id, isExpanded, path)
   * - Removing type-exclusive properties (e.g., facsimileOnly from
   *   section nodes)
   * - Removing empty/null optional properties to reduce JSON size
   * 
   * @param node - The TOC node to clean
   */
  private normalizeNodeForSaving(node: TocNode): void {
    // Remove UI-only fields
    delete node.id;
    delete node.isExpanded;
    delete node.path;

    // Remove unnecessary properties based on node type
  
    if (node.type === 'section') {
      // Remove text-node specific properties from section nodes
      delete node.description;
      delete node.date;
      delete node.category;
      delete node.facsimileOnly;

      // Only include itemId if it's not nullish and not empty string
      if ((node.itemId ?? '') === '') {
        delete node.itemId;
      }

      // Only include collapsed if it's false (default is true)
      if (node.collapsed) {
        delete node.collapsed;
      }
    } else if (node.type === 'text') {
      // Remove section-specific properties from text nodes
      delete node.collapsed;
      
      // Remove falsy optional properties
      if (!node.description) {
        delete node.description;
      }
      if (!node.date) {
        delete node.date;
      }
      if (!node.category) {
        delete node.category;
      }
      // Only include facsimileOnly if it's true (default is false)
      if (!node.facsimileOnly) {
        delete node.facsimileOnly;
      }
    }

    // Recursively clean children
    if (node.children) {
      node.children.forEach(
        (child: TocNode) => this.normalizeNodeForSaving(child)
      );
    }
  }

  openReloadTableOfContentsDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reload table of contents',
        message: `This will replace the current table of contents with the one that is saved in the project repository. All changes to the current table of contents will be lost. Continue?`,
        confirmText: 'Reload',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        this.loadTableOfContents();
      }
    });
  }

  openAutoGenerateDialog(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    const dialogRef = this.dialog.open(AutoGenerateTocDialogComponent, {
      data: {
        selectedCollectionId: this.selectedCollectionId,
        selectedSortOption: this.selectedSortOption,
        sortOptions: this.sortOptions
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value && result.selectedSortOption) {
        this.generateFlatToc(result.selectedSortOption);
      }
    });
  }

  private generateFlatToc(sortOption?: string): void {
    if (!this.projectName || !this.selectedCollectionId) {
      return;
    }

    this.isGeneratingFlatToc = true;
    
    // Use provided sort option or default
    const sortBy = sortOption || this.selectedSortOption;
    
    // Load publications for the selected collection and generate
    this.publicationService.getPublications(
      String(this.selectedCollectionId), this.projectName, true, sortBy
    ).pipe(
      take(1)
    ).subscribe({
      next: (publications) => {
        this.currentToc = this.tocService.generateFlatToc(
          this.selectedCollectionId!,
          publications,
          sortBy,
          this.selectedCollection?.name
        );
        this.hasUnsavedChanges = true;
        this.isGeneratingFlatToc = false;
        this.showSuccess('Flat table of contents generated.');
      },
      error: (error) => {
        console.error('Error loading publications:', error);
        this.showError('Failed to load publications for table of contents generation.');
        this.isGeneratingFlatToc = false;
      }
    });
  }

  openUpdateNodeFieldsDialog(): void {
    if (!this.selectedCollectionId || this.hasUnsavedChanges) {
      this.showError('Please save your changes before updating node fields with publication data from the database.');
      return;
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Update node fields with publication data',
        message: `This will replace the ${new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(this.updateFields)} fields of all nodes in the table of contents, which are linked to publications, with fresh publication data from the database. This action will not automatically save the updated table of contents. Continue?`,
        confirmText: 'Update',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        this.updateFromDatabase();
      }
    });
  }

  private updateFromDatabase(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    this.isUpdatingFromDb = true;
    this.tocService.updateTocWithPublicationData(
      this.selectedCollectionId, this.updateFields
    ).pipe(
      take(1)
    ).subscribe({
      next: (updatedToc) => {
        this.currentToc = updatedToc;
        this.hasUnsavedChanges = true;
        this.isUpdatingFromDb = false;
        this.showSuccess('Table of contents updated with fresh publication metadata.');
      },
      error: (error) => {
        console.error('Error updating from database:', error);
        this.showError('Failed to update publication metadata from database.');
        this.isUpdatingFromDb = false;
      }
    });
  }

  markTocAsChanged(): void {
    this.hasUnsavedChanges = true;
    this.tocService.markAsChanged();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: undefined,
      panelClass: ['snackbar-error']
    });
  }
}

