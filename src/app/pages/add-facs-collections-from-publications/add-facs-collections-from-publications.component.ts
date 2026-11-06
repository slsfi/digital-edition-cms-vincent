import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { finalize, Observable, of, switchMap, take } from 'rxjs';

import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { FacsimileCreationConfig, FacsimileCreationSummary } from '../../models/facsimile.model';
import { PublicationCollection } from '../../models/publication.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';


@Component({
  selector: 'add-facs-collections-from-publications',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    RouterLink,
    LoadingSpinnerComponent,
    AsyncPipe
  ],
  templateUrl: './add-facs-collections-from-publications.component.html',
  styleUrl: './add-facs-collections-from-publications.component.scss'
})
export class AddFacsCollectionsFromPublicationsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private publicationService = inject(PublicationService);
  private facsimileService = inject(FacsimileService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup;
  publicationCollections$: Observable<PublicationCollection[]> = of([]);
  readonly isProcessing = signal(false);
  readonly progressMessage = signal('');
  readonly creationSummary = signal<FacsimileCreationSummary | null>(null);

  constructor() {
    this.form = this.fb.group({
      publicationCollectionId: ['', Validators.required],
      numberOfPages: [4, [Validators.required, Validators.min(1)]],
      startPageNumber: [0, [Validators.required, Validators.min(0)]],
      titleSource: ['publication', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    const currentProject = this.projectService.getCurrentProject();
    if (currentProject) {
      this.publicationCollections$ = this.publicationService.getPublicationCollections(currentProject);
      
      // Set up description auto-fill when collection is selected
      this.form.get('publicationCollectionId')?.valueChanges.pipe(
        switchMap(collectionId => {
          if (collectionId) {
            return this.publicationCollections$.pipe(
              switchMap(collections => {
                const selectedCollection = collections.find(c => c.id === collectionId);
                return of(selectedCollection?.name || '');
              })
            );
          }
          return of('');
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(collectionName => {
        if (collectionName) {
          this.form.patchValue({ description: collectionName });
        }
      });
    }
  }

  createFacsimileCollections() {
    if (this.form.valid && !this.isProcessing()) {
      const config: FacsimileCreationConfig = this.form.value;

      this.form.disable({ emitEvent: false });
      this.isProcessing.set(true);
      this.progressMessage.set('Fetching publication list…');
      this.creationSummary.set(null);

      const currentProject = this.projectService.getCurrentProject();
      
      this.facsimileService.createFacsimilesFromPublications(config, currentProject, (index, total) => {
        this.progressMessage.set(`Creating facsimile collection ${index} / ${total}…`);
      }).pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.form.enable({ emitEvent: false });
          this.isProcessing.set(false);
        })
      ).subscribe({
        next: (summary: FacsimileCreationSummary) => {
          this.creationSummary.set(summary);
        },
        error: (error) => {
          console.error('Bulk creation failed:', error);
          this.snackbar.show('Failed to create facsimile collections. Please try again.', 'error');
        }
      });
    }
  }

  navToFacsimileCollections() {
    this.router.navigate(['/facsimile-collections']);
  }
}
