import { Component, input, output, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { of, Subject, throwError } from 'rxjs';

import { TableOfContentsComponent } from './table-of-contents.component';
import { TocTreeComponent } from '../../components/toc-tree/toc-tree.component';
import { Deleted, Published } from '../../models/common.model';
import { FileTree } from '../../models/project.model';
import {
  Publication,
  PublicationCollection,
  PublicationLite
} from '../../models/publication.model';
import { SaveTocResponse, TocResponse, TocRoot } from '../../models/table-of-contents.model';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';
import { TableOfContentsService } from '../../services/table-of-contents.service';

@Component({
  selector: 'toc-tree',
  template: `
    <span class="test-toc-title">{{ toc().text }}</span>
    <span class="test-publication-count">{{ publications().length }}</span>
  `
})
class TestTocTreeComponent {
  readonly toc = input.required<TocRoot>();
  readonly collectionId = input.required<number>();
  readonly publications = input<PublicationLite[]>([]);
  readonly tocChanged = output<void>();
}

describe('TableOfContentsComponent', () => {
  let component: TableOfContentsComponent;
  let fixture: ComponentFixture<TableOfContentsComponent>;
  let collections$: Subject<PublicationCollection[]>;
  let tocFiles$: Subject<FileTree>;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let publicationService: {
    getPublicationCollections: ReturnType<typeof vi.fn>;
    getPublications: ReturnType<typeof vi.fn>;
  };
  let tocService: {
    createNewTocRoot: ReturnType<typeof vi.fn>;
    generateFlatToc: ReturnType<typeof vi.fn>;
    getTocFilesList: ReturnType<typeof vi.fn>;
    loadToc: ReturnType<typeof vi.fn>;
    saveToc: ReturnType<typeof vi.fn>;
    updateTocWithPublicationData: ReturnType<typeof vi.fn>;
  };
  let snackbar: { show: ReturnType<typeof vi.fn> };
  let consoleError: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    collections$ = new Subject<PublicationCollection[]>();
    tocFiles$ = new Subject<FileTree>();
    dialog = { open: vi.fn() };
    publicationService = {
      getPublicationCollections: vi.fn().mockReturnValue(collections$),
      getPublications: vi.fn().mockReturnValue(of([]))
    };
    tocService = {
      createNewTocRoot: vi.fn().mockImplementation(
        (collectionId: number, title?: string) => tocRoot(title ?? 'Table of contents', collectionId)
      ),
      generateFlatToc: vi.fn().mockReturnValue(tocRoot('Generated TOC')),
      getTocFilesList: vi.fn().mockReturnValue(tocFiles$),
      loadToc: vi.fn().mockReturnValue(of(tocRoot())),
      saveToc: vi.fn().mockReturnValue(of(saveResponse())),
      updateTocWithPublicationData: vi.fn().mockReturnValue(of(tocResponse()))
    };
    snackbar = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TableOfContentsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialog, useValue: dialog },
        { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
        { provide: PublicationService, useValue: publicationService },
        { provide: SnackbarService, useValue: snackbar },
        { provide: TableOfContentsService, useValue: tocService }
      ]
    })
    .overrideComponent(TableOfContentsComponent, {
      remove: { imports: [TocTreeComponent] },
      add: { imports: [TestTocTreeComponent] }
    })
    .overrideProvider(MatDialog, { useValue: dialog })
    .compileComponents();

    fixture = TestBed.createComponent(TableOfContentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('renders collections and records initial TOC variants after asynchronous loading', async () => {
    await finishInitialLoad(
      [collection(), collection(8, 'Second collection')],
      ['7.json', '7_fi.json', '7_sv.json', '8_en.json', 'unexpected.json']
    );

    expect(component.collections().map(item => item.name))
      .toEqual(['Test collection', 'Second collection']);
    expect(component.tocVariantsByCollectionId()).toEqual({
      7: { hasUniversal: true, languages: ['fi', 'sv'] },
      8: { hasUniversal: false, languages: ['en'] }
    });

    const collectionSelect = fixture.debugElement.queryAll(By.directive(MatSelect))[0]
      .componentInstance as MatSelect;
    expect(collectionSelect.options.length).toBe(2);
  });

  it('renders publications loaded for the selected collection in the TOC tree', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    const publications$ = new Subject<Publication[]>();
    publicationService.getPublications.mockReturnValue(publications$);

    component.setSelectedCollection(collection());
    await fixture.whenStable();
    publications$.next([publication(31, 'First publication'), publication(32, 'Second publication')]);
    publications$.complete();
    await fixture.whenStable();

    expect(component.publicationsForSelectedCollection().map(item => item.name))
      .toEqual(['First publication', 'Second publication']);
    expect(text('.test-publication-count')).toBe('2');
  });

  it('renders loading, loaded, and not-found states after TOC responses', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    const loadedToc$ = new Subject<TocRoot>();
    tocService.loadToc.mockReturnValueOnce(loadedToc$);

    component.setSelectedCollection(collection());
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Loading…');

    loadedToc$.next(tocRoot('Loaded TOC'));
    loadedToc$.complete();
    await fixture.whenStable();

    expect(text('.test-toc-title')).toBe('Loaded TOC');
    expect(fixture.nativeElement.textContent).toContain('All changes saved');

    tocService.loadToc.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    component.loadTableOfContents();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.test-toc-title')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No table of contents');
    expect(snackbar.show).not.toHaveBeenCalled();
  });

  it('renders an empty state and reports non-404 TOC loading errors', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    component.selectedCollection = collection();
    component.selectedCollectionId = 7;
    component.currentToc.set(tocRoot('Previous TOC'));
    tocService.loadToc.mockReturnValueOnce(throwError(() => ({
      status: 500,
      error: { message: 'TOC could not be loaded.' }
    })));

    component.loadTableOfContents();
    await fixture.whenStable();

    expect(component.currentToc()).toBeNull();
    expect(component.isLoading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('No table of contents');
    expect(snackbar.show).toHaveBeenCalledWith('TOC could not be loaded.', 'error');
  });

  it('renders save progress and immutably records new universal and language variants', async () => {
    await finishInitialLoad([collection()], []);
    const universalSave$ = new Subject<SaveTocResponse>();
    const languageSave$ = new Subject<SaveTocResponse>();
    tocService.saveToc
      .mockReturnValueOnce(universalSave$)
      .mockReturnValueOnce(languageSave$);
    prepareLoadedToc();

    component.saveTableOfContents();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Saving…');

    universalSave$.next(saveResponse('Universal TOC saved.'));
    await fixture.whenStable();

    const variantsAfterUniversalSave = component.tocVariantsByCollectionId();
    const universalEntry = variantsAfterUniversalSave[7];
    expect(universalEntry).toEqual({ hasUniversal: true, languages: [] });
    expect(fixture.nativeElement.textContent).toContain('All changes saved');

    component.currentTocLanguage.set('fi');
    component.hasUnsavedChanges.set(true);
    component.saveTableOfContents();
    await fixture.whenStable();
    languageSave$.next(saveResponse('Finnish TOC saved.'));
    await fixture.whenStable();

    const variantsAfterLanguageSave = component.tocVariantsByCollectionId();
    expect(variantsAfterLanguageSave).not.toBe(variantsAfterUniversalSave);
    expect(variantsAfterLanguageSave[7]).not.toBe(universalEntry);
    expect(variantsAfterLanguageSave[7]).toEqual({ hasUniversal: true, languages: ['fi'] });
    expect(snackbar.show).toHaveBeenLastCalledWith('Finnish TOC saved.');
  });

  it('restores the unsaved status after a save error', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    const save$ = new Subject<SaveTocResponse>();
    tocService.saveToc.mockReturnValue(save$);
    prepareLoadedToc();

    component.saveTableOfContents();
    await fixture.whenStable();
    save$.error({ error: { message: 'Saving failed.' } });
    await fixture.whenStable();

    expect(component.isSaving()).toBe(false);
    expect(component.hasUnsavedChanges()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Unsaved changes');
    expect(snackbar.show).toHaveBeenCalledWith('Saving failed.', 'error');
  });

  it('reverts a cancelled language change and renders a confirmed variant', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    prepareLoadedToc();
    const cancelResult$ = new Subject<{ value: boolean }>();
    const confirmResult$ = new Subject<{ value: boolean }>();
    dialog.open
      .mockReturnValueOnce({ afterClosed: () => cancelResult$ })
      .mockReturnValueOnce({ afterClosed: () => confirmResult$ });
    tocService.loadToc.mockReturnValue(of(tocRoot('Finnish TOC')));

    component.changeTocLanguage('fi');
    await fixture.whenStable();
    cancelResult$.next({ value: false });
    cancelResult$.complete();
    await fixture.whenStable();

    expect(component.currentTocLanguage()).toBeNull();
    expect(component.tocLanguageSelection()).toBeNull();
    expect(languageSelect().value).toBeNull();

    component.changeTocLanguage('fi');
    confirmResult$.next({ value: true });
    confirmResult$.complete();
    await fixture.whenStable();

    expect(component.currentTocLanguage()).toBe('fi');
    expect(component.tocLanguageSelection()).toBe('fi');
    expect(languageSelect().value).toBe('fi');
    expect(tocService.loadToc).toHaveBeenCalledWith(7, 'fi');
    expect(text('.test-toc-title')).toBe('Finnish TOC');
  });

  it('renders auto-generation progress, success, and error states', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    prepareLoadedToc();
    const generatedPublications$ = new Subject<Publication[]>();
    const failedPublications$ = new Subject<Publication[]>();
    publicationService.getPublications
      .mockReturnValueOnce(generatedPublications$)
      .mockReturnValueOnce(failedPublications$);
    dialog.open.mockReturnValue({
      afterClosed: () => of({
        value: true,
        selectedSortOption: 'name',
        selectedFields: { language: true }
      })
    });
    tocService.generateFlatToc.mockReturnValue(tocRoot('Generated TOC'));

    component.openAutoGenerateDialog();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Generating…');

    generatedPublications$.next([publication()]);
    generatedPublications$.complete();
    await fixture.whenStable();

    expect(component.isGeneratingFlatToc()).toBe(false);
    expect(component.hasUnsavedChanges()).toBe(true);
    expect(text('.test-toc-title')).toBe('Generated TOC');
    expect(fixture.nativeElement.textContent).toContain('Unsaved changes');

    component.openAutoGenerateDialog();
    await fixture.whenStable();
    failedPublications$.error(new Error('publication load failed'));
    await fixture.whenStable();

    expect(component.isGeneratingFlatToc()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Unsaved changes');
    expect(snackbar.show).toHaveBeenLastCalledWith(
      'Failed to load publications for table of contents generation.',
      'error'
    );
  });

  it('renders database-update progress, success, and error states', async () => {
    await finishInitialLoad([collection()], ['7.json']);
    prepareLoadedToc(false);
    const update$ = new Subject<TocResponse>();
    const failedUpdate$ = new Subject<TocResponse>();
    tocService.updateTocWithPublicationData
      .mockReturnValueOnce(update$)
      .mockReturnValueOnce(failedUpdate$);
    dialog.open.mockReturnValue({
      afterClosed: () => of({
        value: true,
        selectedTocUpdateFields: { text: true, date: false }
      })
    });

    component.openUpdateNodeFieldsDialog();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Updating…');

    update$.next(tocResponse(tocRoot('Database-updated TOC'), 'TOC updated.'));
    await fixture.whenStable();

    expect(component.isUpdatingFromDb()).toBe(false);
    expect(component.hasUnsavedChanges()).toBe(true);
    expect(text('.test-toc-title')).toBe('Database-updated TOC');
    expect(fixture.nativeElement.textContent).toContain('Unsaved changes');

    component.hasUnsavedChanges.set(false);
    component.openUpdateNodeFieldsDialog();
    await fixture.whenStable();
    failedUpdate$.error({ error: { message: 'Database update failed.' } });
    await fixture.whenStable();

    expect(component.isUpdatingFromDb()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('All changes saved');
    expect(snackbar.show).toHaveBeenLastCalledWith('Database update failed.', 'error');
  });

  it('renders a new TOC and dirty state after starting from the empty state', async () => {
    await finishInitialLoad([collection()], []);
    tocService.loadToc.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    component.setSelectedCollection(collection());
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No table of contents');

    component.newTableOfContents();
    await fixture.whenStable();

    expect(component.currentToc()?.text).toBe('Test collection');
    expect(component.hasUnsavedChanges()).toBe(true);
    expect(text('.test-toc-title')).toBe('Test collection');
    expect(fixture.nativeElement.textContent).toContain('Unsaved changes');
  });

  async function finishInitialLoad(
    collections: PublicationCollection[] = [collection()],
    tocFileNames: string[] = []
  ): Promise<void> {
    collections$.next(collections);
    collections$.complete();
    tocFiles$.next({
      toc: Object.fromEntries(tocFileNames.map(fileName => [fileName, null]))
    });
    tocFiles$.complete();
    await fixture.whenStable();
  }

  function prepareLoadedToc(hasChanges = true): void {
    component.selectedCollection = collection();
    component.selectedCollectionId = 7;
    component.currentToc.set(tocRoot());
    component.currentTocLanguage.set(null);
    component.tocLanguageSelection.set(null);
    component.hasUnsavedChanges.set(hasChanges);
  }

  function languageSelect(): MatSelect {
    return fixture.debugElement.queryAll(By.directive(MatSelect))[1].componentInstance as MatSelect;
  }

  function text(selector: string): string | null {
    return fixture.nativeElement.querySelector(selector)?.textContent?.trim() ?? null;
  }
});

function collection(id = 7, name = 'Test collection'): PublicationCollection {
  return {
    collection_intro_filename: null,
    collection_intro_published: 0,
    collection_title_filename: '',
    collection_title_published: 0,
    date_created: '',
    date_modified: null,
    id,
    name,
    name_translation_id: null,
    project_id: 1,
    published: Published.NotPublished,
    title: name
  };
}

function publication(id = 31, name = 'Publication'): Publication {
  return {
    date_created: '',
    date_modified: null,
    deleted: Deleted.NotDeleted,
    genre: null,
    id,
    language: 'fi',
    name,
    original_filename: `${id}.xml`,
    original_publication_date: '1900-01-01',
    publication_collection_id: 7,
    publication_comment_id: null,
    published: Published.NotPublished
  };
}

function tocRoot(text = 'Loaded TOC', collectionId = 7): TocRoot {
  return {
    text,
    collectionId: String(collectionId),
    type: 'title',
    children: []
  };
}

function saveResponse(message = 'TOC saved.'): SaveTocResponse {
  return { success: true, message, data: null };
}

function tocResponse(data = tocRoot(), message = 'TOC updated.'): TocResponse {
  return { success: true, message, data };
}
