import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AddFacsCollectionsFromPublicationsComponent } from './add-facs-collections-from-publications.component';
import { FacsimileCreationSummary } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('AddFacsCollectionsFromPublicationsComponent', () => {
  let component: AddFacsCollectionsFromPublicationsComponent;
  let fixture: ComponentFixture<AddFacsCollectionsFromPublicationsComponent>;
  let creationResult$: Subject<FacsimileCreationSummary>;
  let createFacsimiles: ReturnType<typeof vi.fn<FacsimileService['createFacsimilesFromPublications']>>;
  let snackbar: {
    show: ReturnType<typeof vi.fn>;
    showProgress: ReturnType<typeof vi.fn>;
  };
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    creationResult$ = new Subject<FacsimileCreationSummary>();
    createFacsimiles = vi.fn<FacsimileService['createFacsimilesFromPublications']>().mockReturnValue(creationResult$);
    snackbar = {
      show: vi.fn(),
      showProgress: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AddFacsCollectionsFromPublicationsComponent],
      providers: [
        provideRouter([]),
        {
          provide: FacsimileService,
          useValue: { createFacsimilesFromPublications: createFacsimiles }
        },
        { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
        { provide: PublicationService, useValue: { getPublicationCollections: () => of([]) } },
        { provide: SnackbarService, useValue: snackbar }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFacsCollectionsFromPublicationsComponent);
    component = fixture.componentInstance;
    component.form.patchValue({ publicationCollectionId: 1 });
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    consoleWarn.mockRestore();
  });

  it('renders the completion summary after successful bulk creation', async () => {
    component.form.patchValue({ description: 'Custom description' });
    const settings = component.form.value;
    const formChanges = vi.fn();
    const formSubscription = component.form.valueChanges.subscribe(formChanges);
    expectFieldsDisabled(false);
    submitForm();
    await fixture.whenStable();

    expect(component.isProcessing()).toBe(true);
    expectFieldsDisabled(true);
    expect(createFacsimiles).toHaveBeenCalledWith(settings, 'test-project', expect.any(Function));
    expect(fixture.nativeElement.querySelector('.processing-section')).not.toBeNull();
    expect(snackbar.showProgress).not.toHaveBeenCalled();
    expect(component.progressMessage()).toBe('Fetching publication list…');

    creationResult$.next({
      total: 2,
      successful: 1,
      failed: 1,
      results: [
        {
          success: true,
          publicationId: 1,
          publicationName: 'Successful publication',
          facsimileId: 10,
          facsimileTitle: 'Successful publication',
          index: 0,
          total: 2
        },
        {
          success: false,
          publicationId: 2,
          publicationName: 'Failed publication',
          error: 'Creation failed',
          index: 1,
          total: 2
        }
      ]
    });
    await fixture.whenStable();

    expect(component.isProcessing()).toBe(false);
    expectFieldsDisabled(false);
    expect(component.form.value).toEqual(settings);
    expect(formChanges).not.toHaveBeenCalled();
    formSubscription.unsubscribe();
    expect(fixture.nativeElement.querySelector('.processing-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('.results-section')?.textContent)
      .toContain('Successfully created: 1');
    expect(fixture.nativeElement.querySelector('.results-section')?.textContent)
      .toContain('Failed publication');
    expect(snackbar.show).not.toHaveBeenCalled();
  });

  it('removes the processing state and reports a bulk-creation error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockReturnValue(undefined);
    submitForm();
    await fixture.whenStable();
    expectFieldsDisabled(true);

    creationResult$.error(new Error('request failed'));
    await fixture.whenStable();

    expect(component.isProcessing()).toBe(false);
    expectFieldsDisabled(false);
    expect(fixture.nativeElement.querySelector('.processing-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('.results-section')).toBeNull();
    expect(snackbar.show).toHaveBeenCalledWith(
      'Failed to create facsimile collections. Please try again.',
      'error'
    );
    consoleError.mockRestore();
  });

  it('updates the message below the spinner for each publication without opening a progress snackbar', async () => {
    submitForm();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.processing-section p')?.textContent)
      .toBe('Fetching publication list…');

    expect(createFacsimiles).toHaveBeenCalledWith(
      expect.objectContaining({ publicationCollectionId: 1, titleSource: 'publication' }),
      'test-project',
      expect.any(Function)
    );
    const onProgress = createFacsimiles.mock.calls[0][2];
    onProgress?.(1, 3);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.processing-section p')?.textContent)
      .toBe('Creating facsimile collection 1 / 3…');

    onProgress?.(2, 3);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.processing-section p')?.textContent)
      .toBe('Creating facsimile collection 2 / 3…');
    expect(snackbar.showProgress).not.toHaveBeenCalled();
    expect(snackbar.show).not.toHaveBeenCalled();
  });

  it('does not start overlapping operations or start with an invalid form', () => {
    component.form.patchValue({ publicationCollectionId: '' });
    component.createFacsimileCollections();
    expect(createFacsimiles).not.toHaveBeenCalled();
    expect(snackbar.showProgress).not.toHaveBeenCalled();

    component.form.patchValue({ publicationCollectionId: 1 });
    component.createFacsimileCollections();
    component.createFacsimileCollections();
    expect(createFacsimiles).toHaveBeenCalledTimes(1);
    expect(snackbar.showProgress).not.toHaveBeenCalled();
  });

  it('clears the processing state for a synchronously completed empty collection', async () => {
    createFacsimiles.mockReturnValueOnce(of({ total: 0, successful: 0, failed: 0, results: [] }));
    submitForm();
    await fixture.whenStable();
    expect(component.isProcessing()).toBe(false);
    expectFieldsDisabled(false);
    expect(fixture.nativeElement.querySelector('.processing-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('.results-section')?.textContent)
      .toContain('Successfully created: 0');
  });

  it('unsubscribes and clears the processing state on destruction without publishing a completion summary', async () => {
    submitForm();
    await fixture.whenStable();
    expect(creationResult$.observed).toBe(true);
    fixture.destroy();
    expect(creationResult$.observed).toBe(false);
    expect(component.isProcessing()).toBe(false);

    creationResult$.next({ total: 0, successful: 0, failed: 0, results: [] });
    expect(component.creationSummary()).toBeNull();
    expect(snackbar.show).not.toHaveBeenCalled();
  });

  function submitForm(): void {
    const submitButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Create facsimile collections'));

    expect(submitButton).toBeDefined();
    submitButton?.click();
  }

  function expectFieldsDisabled(disabled: boolean): void {
    const inputs = fixture.nativeElement.querySelectorAll('form input') as NodeListOf<HTMLInputElement>;
    const selects = fixture.nativeElement.querySelectorAll('form mat-select') as NodeListOf<HTMLElement>;
    expect(inputs).toHaveLength(3);
    expect(selects).toHaveLength(2);
    for (const input of inputs) {
      expect(input.disabled).toBe(disabled);
    }
    for (const select of selects) {
      expect(select.getAttribute('aria-disabled')).toBe(String(disabled));
    }
  }
});
