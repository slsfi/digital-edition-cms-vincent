import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, forkJoin, map, of, Subject, switchMap, take } from 'rxjs';

import { TableOfContentsService } from '../../services/table-of-contents.service';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';
import { languageOptions, LanguageObjWithNone } from '../../models/language.model';
import { FileTree } from '../../models/project.model';
import { SaveTocResponse, TocLanguageVariants, TocNode, TocResponse,
         TocRoot, GENERATE_TOC_FIELDS, UPDATE_TOC_FIELDS,
         PUBLICATION_SORT_OPTIONS, UNIVERSAL_TOC_LANGUAGE
        } from '../../models/table-of-contents.model';
import { Publication, PublicationCollection, PublicationLite,
         toPublicationLite } from '../../models/publication.model';
import { TocTreeComponent } from '../../components/toc-tree/toc-tree.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { AutoGenerateTocDialogComponent, AutoGenerateTocDialogData,
         AutoGenerateTocDialogResult
        } from '../../components/auto-generate-toc-dialog/auto-generate-toc-dialog.component';
import { ExistingTocLanguagesPipe } from '../../pipes/existing-toc-languages.pipe';
import { GetLangLabelPipe } from '../../pipes/get-lang-label.pipe';
import { NonExistingTocLanguagesPipe } from '../../pipes/non-existing-toc-languages.pipe';

interface TocLoadRequest {
  collectionId: number;
  language: string | null;
}

type TocLoadResult =
  | { toc: TocRoot; error: null }
  | { toc: null; error: HttpErrorResponse };

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
    TocTreeComponent,
    ExistingTocLanguagesPipe,
    GetLangLabelPipe,
    NonExistingTocLanguagesPipe
  ],
  templateUrl: './table-of-contents.component.html',
  styleUrls: ['./table-of-contents.component.scss']
})
export class TableOfContentsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly projectService = inject(ProjectService);
  private readonly publicationService = inject(PublicationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly tocService = inject(TableOfContentsService);

  projectName: string | null = null;

  // Collections
  readonly collections = signal<PublicationCollection[]>([]);
  selectedCollection: PublicationCollection | null = null;
  selectedCollectionId: number | null = null;
  readonly collectionSelection = signal<PublicationCollection | null>(null);

  // Table of Contents
  readonly currentToc = signal<TocRoot | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly hasUnsavedChanges = signal(false);
  private tocRevision = 0;

  // Auto-generation
  selectedSortOption = 'id';
  readonly isGeneratingFlatToc = signal(false);

  // Data sync
  readonly isUpdatingFromDb = signal(false);

  // Publications cache for selected collection
  readonly publicationsForSelectedCollection = signal<PublicationLite[]>([]);
  readonly isLoadingPublications = signal(false);
  private readonly publicationLoadRequests = new Subject<{
    collectionId: number;
    projectName: string;
  }>();
  private readonly tocLoadRequests = new Subject<TocLoadRequest>();

  // Table of contents language variants per collection
  // Example: { 1: { hasUniversal: true, languages: ['fi', 'sv'] } }
  readonly tocVariantsByCollectionId = signal<Record<number, TocLanguageVariants>>({});

  // Default value used when a collection has no entry in
  // tocVariantsByCollectionId
  readonly emptyTocVariants = {
    hasUniversal: false,
    languages: [] as string[]
  };

  // Currently selected language variant for the TOC of the selected
  // collection.
  // null => general (no language; <id>.json)
  readonly currentTocLanguage = signal<string | null>(null);

  // The language currently selected in the UI language select.
  // This can temporarily diverge from currentTocLanguage if the
  // user cancels a language change.
  readonly tocLanguageSelection = signal<string | null>(null);

  // Languages the user can choose when creating/saving TOCs.
  readonly availableLanguages: readonly LanguageObjWithNone[] = languageOptions;

  // Universal / language-independent ToC option (label + code)
  readonly universalTocLanguage = UNIVERSAL_TOC_LANGUAGE;

  ngOnInit(): void {
    this.observePublicationLoads();
    this.observeTocLoads();

    // Get project name
    this.projectName = this.projectService.getCurrentProject();

    // Load collections
    this.loadCollections(this.projectName);
  }

  /**
   * Load initial metadata for the TOC management view.
   *
   * - In parallel, fetch:
   *   - publication collections for the current project (required)
   *   - the list of existing TOC JSON files (optional metadata)
   *
   * - Using forkJoin so we only proceed once both calls have completed.
   *   - If loading collections fails, the whole operation fails and an
   *     error is shown (user cannot work without collections).
   *   - If loading the TOC file list fails, the error is logged and we
   *     fall back to an empty TOC variant map (user can still create new
   *     TOCs).
   *
   * - After both responses arrive:
   *   - this.collections is populated with the available collections.
   *   - this.tocVariantsByCollectionId is built by parsing the TOC file
   *     names to detect, per collection, whether a universal TOC and/or
   *     language-specific TOCs already exist.
   *
   * This ensures that when the user selects a collection, the language
   * selector and default TOC language are based on up-to-date backend
   * data, without race conditions between the two API calls.
   */
  private loadCollections(projectName: string | null): void {
    if (!projectName) {
      return;
    }

    forkJoin({
      collections:
        this.publicationService.getPublicationCollections(projectName).pipe(
          take(1)
        ), // fatal on error

      tocFiles:
        this.tocService.getTocFilesList().pipe(
          take(1),
          catchError(err => {
            console.error('Error loading TOC file list:', err);
            return of({ toc: {} } as FileTree);
          }) // Swallow errors and return a safe fallback
        )
    }).subscribe({
      next: ({ collections, tocFiles }) => {
        // Parse ToC variants
        const toc = tocFiles['toc'] ?? {};
        const topLevelJsonFiles = Object.keys(toc).filter(
          key => key.endsWith('.json')
        );

        const variants: Record<number, TocLanguageVariants> = {};

        for (const filename of topLevelJsonFiles) {
          const base = filename.split('.json')[0];
          const parts = base.split('_');
          const idPart = parts[0];
          const langPart = parts[1] ?? null;

          const collectionId = Number(idPart);
          if (Number.isNaN(collectionId)) continue;  // ignore unexpected filenames

          if (!variants[collectionId]) {
            variants[collectionId] = { hasUniversal: false, languages: [] };
          }

          if (!langPart) {
            variants[collectionId].hasUniversal = true;
          } else if (!variants[collectionId].languages.includes(langPart)) {
            variants[collectionId].languages.push(langPart);
          }
        }

        this.tocVariantsByCollectionId.set(variants);
        // console.log('tocVariantsByCollectionId', this.tocVariantsByCollectionId);

        // Set collections
        this.collections.set(collections);
      },
      error: err => {
        // Only triggers if the *collections* call fails
        console.error('Error loading collections:', err);
        this.snackbar.show('Failed to load collections.', 'error');
      }
    });
  }

  setSelectedCollection(collection: PublicationCollection): void {
    this.collectionSelection.set(collection);

    if (!this.hasUnsavedChanges()) {
      this.commitSelectedCollection(collection);
      return;
    }

    const previousCommittedCollection = this.selectedCollection;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Change publication collection',
        message: 'You have unsaved changes. Switching collection will discard them. Continue?',
        confirmText: 'Change collection',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        this.hasUnsavedChanges.set(false);
        this.commitSelectedCollection(collection);
      } else {
        this.collectionSelection.set(previousCommittedCollection);
      }
    });
  }

  private commitSelectedCollection(collection: PublicationCollection): void {
    this.selectedCollection = collection;
    this.selectedCollectionId = collection.id;

    // Pick a default TOC language variant for this collection:
    const variants = this.tocVariantsByCollectionId()[collection.id];
    // Initial TOC language:
    // - universal TOC exists -> null
    // - no universal, but language variants exist -> first language
    // - no variants or empty variants -> null
    const initialLanguage = variants?.hasUniversal
      ? null
      : variants?.languages[0] ?? null;

    this.currentTocLanguage.set(initialLanguage);
    this.tocLanguageSelection.set(initialLanguage);

    this.loadPublicationsForSelectedCollection();
    this.loadTableOfContents();
  }

  private loadPublicationsForSelectedCollection(): void {
    if (!this.projectName || !this.selectedCollectionId) {
      this.publicationsForSelectedCollection.set([]);
      return;
    }

    this.publicationLoadRequests.next({
      collectionId: this.selectedCollectionId,
      projectName: this.projectName
    });
  }

  private observePublicationLoads(): void {
    this.publicationLoadRequests.pipe(
      switchMap(({ collectionId, projectName }) => {
        this.isLoadingPublications.set(true);
        return this.publicationService.getPublications(
          String(collectionId), projectName, true, 'name'
        ).pipe(
          // convert Publication[] -> PublicationLite[]
          map((list: Publication[]) => list.map(toPublicationLite)),
          take(1),
          catchError(() => of([] as PublicationLite[])),
          finalize(() => this.isLoadingPublications.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(publications => {
      this.publicationsForSelectedCollection.set(publications);
    });
  }

  loadTableOfContents(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    this.tocLoadRequests.next({
      collectionId: this.selectedCollectionId,
      language: this.currentTocLanguage()
    });
  }

  private observeTocLoads(): void {
    this.tocLoadRequests.pipe(
      switchMap(({ collectionId, language }) => {
        this.isLoading.set(true);
        return this.tocService.loadToc(
          collectionId,
          language || undefined
        ).pipe(
          take(1),
          map((toc): TocLoadResult => ({ toc, error: null })),
          catchError((error: HttpErrorResponse) => of<TocLoadResult>({ toc: null, error })),
          finalize(() => this.isLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ toc, error }) => {
      if (error) {
        console.error('Error loading table of contents:', error);
        if (error.status !== 404) {
          this.snackbar.show(error.error?.message || 'Failed to load table of contents.', 'error');
        }
      }

      this.currentToc.set(toc); // Clear the previous TOC on error
      this.hasUnsavedChanges.set(false);
    });
  }

  saveTableOfContents(): void {
    const currentToc = this.currentToc();
    const collectionId = this.selectedCollectionId;
    if (!currentToc || !collectionId) {
      return;
    }

    const language = this.currentTocLanguage();
    const revision = this.tocRevision;

    // Clean the TOC data before saving
    const cleanedToc = this.cleanTocForSaving(currentToc);

    this.isSaving.set(true);
    this.tocService.saveToc(collectionId, cleanedToc, language || undefined).pipe(
      take(1),
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (response: SaveTocResponse) => {
        if (response.success) {
          const savedTocIsStillCurrent =
            this.selectedCollectionId === collectionId &&
            this.currentTocLanguage() === language &&
            this.currentToc() === currentToc &&
            this.tocRevision === revision;
          if (savedTocIsStillCurrent) {
            this.hasUnsavedChanges.set(false);
          }
          this.snackbar.show(response.message);

          // refresh tocVariantsByCollectionId if new file just created
          this.tocVariantsByCollectionId.update(variants => {
            const entry = variants[collectionId] ?? { hasUniversal: false, languages: [] };
            const updatedEntry: TocLanguageVariants = !language
              ? { ...entry, hasUniversal: true, languages: [...entry.languages] }
              : {
                  ...entry,
                  languages: entry.languages.includes(language)
                    ? [...entry.languages]
                    : [...entry.languages, language]
                };

            return { ...variants, [collectionId]: updatedEntry };
          });
        }
      },
      error: (error) => {
        console.error('Error saving table of contents:', error);
        this.snackbar.show(error.error?.message || 'Failed to save table of contents.', 'error');
      }
    });
  }

  changeTocLanguage(newLanguage: string | null): void {
    this.tocLanguageSelection.set(newLanguage);

    // If there are no unsaved changes, just commit immediately.
    if (!this.hasUnsavedChanges()) {
      this.currentTocLanguage.set(newLanguage);
      this.loadTableOfContents();
      return;
    }

    const previousCommittedLanguage = this.currentTocLanguage();

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
        this.hasUnsavedChanges.set(false);
        this.currentTocLanguage.set(newLanguage);
        this.loadTableOfContents();
      } else {
        // User cancelled: revert the UI selection back to the committed language
        this.tocLanguageSelection.set(previousCommittedLanguage);
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
        const selectedFields: Record<string, boolean> = result.selectedFields || {};
        const enabledFields: string[] = Object.keys(selectedFields).filter(key => selectedFields[key]);
        this.generateFlatToc(result.selectedSortOption, enabledFields);
      }
    });
  }

  private generateFlatToc(sortOption?: string, includedFields?: string[]): void {
    if (!this.projectName || !this.selectedCollectionId) {
      return;
    }

    this.isGeneratingFlatToc.set(true);
    
    // Use provided sort option or default
    const sortBy = sortOption || this.selectedSortOption;
    
    // Load publications for the selected collection and generate
    this.publicationService.getPublications(
      String(this.selectedCollectionId), this.projectName, true, sortBy
    ).pipe(
      take(1)
    ).subscribe({
      next: (publications: Publication[]) => {
        this.currentToc.set(this.tocService.generateFlatToc(
          this.selectedCollectionId!,
          publications,
          sortBy,
          this.selectedCollection?.name,
          includedFields
        ));
        this.hasUnsavedChanges.set(true);
        this.isGeneratingFlatToc.set(false);
        this.snackbar.show('Flat table of contents generated.');
      },
      error: (error) => {
        console.error('Error loading publications:', error);
        this.snackbar.show('Failed to load publications for table of contents generation.', 'error');
        this.isGeneratingFlatToc.set(false);
      }
    });
  }

  openUpdateNodeFieldsDialog(): void {
    if (!this.selectedCollectionId || this.hasUnsavedChanges()) {
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
        const selectedFields: Record<string, boolean> = result.selectedTocUpdateFields || {};
        const enabledFields: string[] = Object.keys(selectedFields).filter(key => selectedFields[key]);
        this.updateFromDatabase(enabledFields);
      }
    });
  }

  private updateFromDatabase(fields: string[]): void {
    if (fields.length === 0 || !this.selectedCollectionId) {
      return;
    }

    this.isUpdatingFromDb.set(true);
    this.tocService.updateTocWithPublicationData(
      this.selectedCollectionId, fields
    ).pipe(
      take(1),
      finalize(() => this.isUpdatingFromDb.set(false))
    ).subscribe({
      next: (response: TocResponse) => {
        this.currentToc.set(response.data);
        this.hasUnsavedChanges.set(true);
        this.snackbar.show(response.message);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error updating from database:', error);
        this.snackbar.show(
          error.error?.message || 'Failed to update item fields with publication data.',
          'error'
        );
      }
    });
  }

  newTableOfContents(): void {
    if (!this.selectedCollectionId) {
      return;
    }

    if (this.currentToc() === null) {
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
    this.currentToc.set(this.tocService.createNewTocRoot(
      this.selectedCollectionId!,
      this.selectedCollection?.name
    ));
    this.hasUnsavedChanges.set(true);
  }

  markTocAsChanged(): void {
    this.tocRevision++;
    this.hasUnsavedChanges.set(true);
  }

}
