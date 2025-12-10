import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { map, take } from 'rxjs';

import { TableOfContentsService } from '../../services/table-of-contents.service';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';
import { languageOptions } from '../../models/language.model';
import { FileTree } from '../../models/project.model';
import { SaveTocResponse, TocNode, TocResponse, TocRoot, GENERATE_TOC_FIELDS,
         UPDATE_TOC_FIELDS, PUBLICATION_SORT_OPTIONS } from '../../models/table-of-contents.model';
import { Publication, PublicationCollection, PublicationLite,
         toPublicationLite } from '../../models/publication.model';
import { TocTreeComponent } from '../../components/toc-tree/toc-tree.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { AutoGenerateTocDialogComponent, AutoGenerateTocDialogData,
         AutoGenerateTocDialogResult } from '../../components/auto-generate-toc-dialog/auto-generate-toc-dialog.component';


@Component({
  selector: 'toc-management',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TocTreeComponent
  ],
  templateUrl: './table-of-contents.component.html',
  styleUrls: ['./table-of-contents.component.scss']
})
export class TableOfContentsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly projectService = inject(ProjectService);
  private readonly publicationService = inject(PublicationService);
  private readonly snackbar = inject(SnackbarService);
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
  selectedSortOption = 'id';
  isGeneratingFlatToc = false;

  // Data sync
  isUpdatingFromDb = false;

  // Publications cache for selected collection
  publicationsForSelectedCollection: PublicationLite[] = [];

  // Table of contents language variants per collection
  // Example: { 1: { hasGeneral: true, languages: ['fi', 'sv'] } }
  tocVariantsByCollectionId: Record<number, { hasGeneral: boolean; languages: string[] }> = {};

  // Default value used when a collection has no entry in
  // tocVariantsByCollectionId
  readonly emptyTocVariants = {
    hasGeneral: false,
    languages: [] as string[]
  };

  // Currently selected language variant for the TOC of the selected
  // collection.
  // null => general (no language; <id>.json)
  currentTocLanguage: string | null = null;

  // The language currently selected in the UI language select.
  // This can temporarily diverge from currentTocLanguage if the
  // user cancels a language change.
  tocLanguageSelection: string | null = null;

  // Languages the user can choose when creating/saving TOCs.
  readonly availableLanguages = languageOptions;

  ngOnInit(): void {
    // Get project name
    this.projectName = this.projectService.getCurrentProject();

    // Load collections
    this.loadCollections(this.projectName);
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
        this.snackbar.show('Failed to load collections.', 'error');
      }
    });

    // Load existing TOC JSON files to detect per-collection language variants
    this.tocService.getTocFilesList().pipe(take(1)).subscribe({
      next: (filetree: FileTree) => {
        const toc = filetree['toc'] ?? {};
        const topLevelJsonFiles = Object.keys(toc).filter(key =>
          key.endsWith('.json')
        );

        const variants: Record<number, { hasGeneral: boolean; languages: string[] }> = {};

        for (const filename of topLevelJsonFiles) {
          // strip .json
          const base = filename.split('.json')[0];
          const parts = base.split('_'); // e.g. "1", "1_sv"
          const idPart = parts[0];
          const langPart = parts[1] ?? null;

          const collectionId = Number(idPart);
          if (Number.isNaN(collectionId)) {
            continue; // ignore unexpected filenames
          }

          if (!variants[collectionId]) {
            variants[collectionId] = {
              hasGeneral: false,
              languages: []
            };
          }

          if (!langPart) {
            variants[collectionId].hasGeneral = true;
          } else if (!variants[collectionId].languages.includes(langPart)) {
            variants[collectionId].languages.push(langPart);
          }
        }

        this.tocVariantsByCollectionId = variants;
        // console.log('tocVariantsByCollectionId', this.tocVariantsByCollectionId);
      },
      error: (err) => {
        console.error('Error loading TOC file list:', err);
        // Non-fatal; just means we don't know which languages exist
      }
    });
  }

  setSelectedCollection(collection: PublicationCollection): void {
    this.selectedCollection = collection;
    this.selectedCollectionId = collection.id;

    // Pick a default TOC language variant for this collection:
    const variants = this.tocVariantsByCollectionId[collection.id];
    let initialLanguage: string | null = null;

    if (variants) {
      if (variants.hasGeneral) {
        initialLanguage = null;      // general
      } else if (variants.languages.length > 0) {
        initialLanguage = variants.languages[0];  // first language-specific
      } else {
        initialLanguage = null;
      }
    } else {
      // No saved TOC yet
      initialLanguage = null;
    }

    this.currentTocLanguage = initialLanguage;
    this.tocLanguageSelection = initialLanguage;

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
    this.tocService.loadToc(
      this.selectedCollectionId,
      this.currentTocLanguage || undefined
    ).pipe(
      take(1)
    ).subscribe({
      next: (toc: TocRoot) => {
        this.currentToc = toc;
        this.hasUnsavedChanges = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading table of contents:', error);
        this.snackbar.show(error.error?.message || 'Failed to load table of contents.', 'error');
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
    this.tocService.saveToc(this.selectedCollectionId, cleanedToc, this.currentTocLanguage || undefined).pipe(
      take(1)
    ).subscribe({
      next: (response: SaveTocResponse) => {
        if (response.success) {
          this.hasUnsavedChanges = false;
          this.snackbar.show(response.message);

          // refresh tocVariantsByCollectionId if new file just created
          const id = this.selectedCollectionId!;
          const lang = this.currentTocLanguage;
          if (!this.tocVariantsByCollectionId[id]) {
            this.tocVariantsByCollectionId[id] = { hasGeneral: false, languages: [] };
          }
          const entry = this.tocVariantsByCollectionId[id];
          if (!lang) {
            entry.hasGeneral = true;
          } else if (!entry.languages.includes(lang)) {
            entry.languages.push(lang);
          }
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving table of contents:', error);
        this.snackbar.show(error.error?.message || 'Failed to save table of contents.', 'error');
        this.isSaving = false;
      }
    });
  }

  changeTocLanguage(newLanguage: string | null): void {
    // If there are no unsaved changes, just commit immediately.
    if (!this.hasUnsavedChanges) {
      this.currentTocLanguage = newLanguage;
      this.loadTableOfContents();
      return;
    }

    const previousCommittedLanguage = this.currentTocLanguage;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Change table of contents language',
        message: 'You have unsaved changes. Switching language will discard them. Continue?',
        confirmText: 'Change language',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        // User confirmed: commit new selection
        this.hasUnsavedChanges = false;
        this.currentTocLanguage = newLanguage;
        this.loadTableOfContents();
      } else {
        // User cancelled: revert the UI selection back to the committed language
        this.tocLanguageSelection = previousCommittedLanguage;
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

    // Remove falsy properties
    if (!node.description) {
      delete node.description;
    }

    if (!node.language) {
      delete node.language;
    }

    // Remove unnecessary properties based on node type
  
    if (node.type === 'section') {
      // Remove text-node specific properties from section nodes
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
        message: `This will replace the current table of contents with the one that is saved in the project repository. All unsaved changes to the current table of contents will be lost.`,
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

    const dialogRef = this.dialog.open<
      AutoGenerateTocDialogComponent,
      AutoGenerateTocDialogData,
      AutoGenerateTocDialogResult
    >(AutoGenerateTocDialogComponent, {
      data: {
        selectedCollectionId: this.selectedCollectionId,
        selectedSortOption: this.selectedSortOption,
        sortOptions: PUBLICATION_SORT_OPTIONS,
        includedFields: GENERATE_TOC_FIELDS
      } satisfies AutoGenerateTocDialogData
    });

    dialogRef.afterClosed().subscribe((result?: AutoGenerateTocDialogResult) => {
      if (result?.value && result.selectedSortOption) {
        const selectedFields: { [key: string]: boolean } = result.selectedFields || {};
        const enabledFields: string[] = Object.keys(selectedFields).filter(key => selectedFields[key]);
        this.generateFlatToc(result.selectedSortOption, enabledFields);
      }
    });
  }

  private generateFlatToc(sortOption?: string, includedFields?: string[]): void {
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
      next: (publications: Publication[]) => {
        this.currentToc = this.tocService.generateFlatToc(
          this.selectedCollectionId!,
          publications,
          sortBy,
          this.selectedCollection?.name,
          includedFields
        );
        this.hasUnsavedChanges = true;
        this.isGeneratingFlatToc = false;
        this.snackbar.show('Flat table of contents generated.');
      },
      error: (error) => {
        console.error('Error loading publications:', error);
        this.snackbar.show('Failed to load publications for table of contents generation.', 'error');
        this.isGeneratingFlatToc = false;
      }
    });
  }

  openUpdateNodeFieldsDialog(): void {
    if (!this.selectedCollectionId || this.hasUnsavedChanges) {
      this.snackbar.show('Please save your changes before updating item fields with publication data from the database.', 'error');
      return;
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Update item fields with publication data',
        message: 'This action will update the selected fields of all items that are linked to publications, with fresh publication data from the database. Please observe that missing publication data in the database will result in empty field values. Items whose `itemId` have been modified with chapter/position information will not be updated. The updated table of contents will not be saved automatically.',
        confirmText: 'Update',
        cancelText: 'Cancel',
        showTocUpdateFields: true,
        tocUpdateFields: UPDATE_TOC_FIELDS
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        const selectedFields: { [key: string]: boolean } = result.selectedTocUpdateFields || {};
        const enabledFields: string[] = Object.keys(selectedFields).filter(key => selectedFields[key]);
        this.updateFromDatabase(enabledFields);
      }
    });
  }

  private updateFromDatabase(fields: string[]): void {
    if (fields.length === 0 || !this.selectedCollectionId) {
      return;
    }

    this.isUpdatingFromDb = true;
    this.tocService.updateTocWithPublicationData(
      this.selectedCollectionId, fields
    ).pipe(
      take(1)
    ).subscribe({
      next: (response: TocResponse) => {
        this.currentToc = response.data;
        this.hasUnsavedChanges = true;
        this.isUpdatingFromDb = false;
        this.snackbar.show(response.message);
      },
      error: (error) => {
        console.error('Error updating from database:', error);
        this.snackbar.show(error.error.message, 'error');
        this.isUpdatingFromDb = false;
      }
    });
  }

  newTableOfContents(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    if (this.currentToc === null) {
      this.createNewToc();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Create new table of contents',
        message: `This will clear the current table of contents and create a new, empty one. All unsaved changes to the current table of contents will be lost.`,
        confirmText: 'Create',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        this.createNewToc();
      }
    });
  }

  private createNewToc() {
    this.currentToc = this.tocService.createNewTocRoot(
      this.selectedCollectionId!,
      this.selectedCollection?.name
    );
    this.hasUnsavedChanges = true;
  }

  markTocAsChanged(): void {
    this.hasUnsavedChanges = true;
  }

}
