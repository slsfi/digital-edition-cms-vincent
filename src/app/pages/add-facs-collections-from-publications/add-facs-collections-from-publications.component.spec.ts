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
  let snackbar: { show: ReturnType<typeof vi.fn> };
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    creationResult$ = new Subject<FacsimileCreationSummary>();
    snackbar = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AddFacsCollectionsFromPublicationsComponent],
      providers: [
        provideRouter([]),
        {
          provide: FacsimileService,
          useValue: { createFacsimilesFromPublications: () => creationResult$ }
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
    consoleWarn.mockRestore();
  });

  it('renders the completion summary after successful bulk creation', async () => {
    submitForm();
    await fixture.whenStable();

    expect(component.isProcessing()).toBe(true);
    expect(fixture.nativeElement.querySelector('.processing-section')).not.toBeNull();

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
    expect(fixture.nativeElement.querySelector('.processing-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('.results-section')?.textContent)
      .toContain('Successfully created: 1');
    expect(fixture.nativeElement.querySelector('.results-section')?.textContent)
      .toContain('Failed publication');
  });

  it('removes the processing state and reports a bulk-creation error', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined);
    submitForm();
    await fixture.whenStable();

    creationResult$.error(new Error('request failed'));
    await fixture.whenStable();

    expect(component.isProcessing()).toBe(false);
    expect(fixture.nativeElement.querySelector('.processing-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('.results-section')).toBeNull();
    expect(snackbar.show).toHaveBeenCalledWith(
      'Failed to create facsimile collections. Please try again.',
      'error'
    );
  });

  function submitForm(): void {
    const submitButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Create facsimile collections'));

    expect(submitButton).toBeDefined();
    submitButton?.click();
  }
});
