import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap, take } from 'rxjs';

import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { FacsimileCreationConfig, FacsimileCreationSummary } from '../../models/facsimile.model';
import { PublicationCollection } from '../../models/publication.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';


@Component({
  selector: 'add-facsimile-from-publications',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    RouterLink,
    LoadingSpinnerComponent
  ],
  templateUrl: './add-facsimile-from-publications.component.html',
  styleUrl: './add-facsimile-from-publications.component.scss'
})
export class AddFacsimileFromPublicationsComponent implements OnInit {
  form: FormGroup;
  publicationCollections$: Observable<PublicationCollection[]> = of([]);
  isProcessing = false;
  progressMessage = '';
  creationSummary: FacsimileCreationSummary | null = null;

  constructor(
    private fb: FormBuilder,
    private publicationService: PublicationService,
    private facsimileService: FacsimileService,
    private projectService: ProjectService,
    private router: Router,
    private snackbar: MatSnackBar
  ) {
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
        })
      ).subscribe(collectionName => {
        if (collectionName) {
          this.form.patchValue({ description: collectionName });
        }
      });
    }
  }

  createFacsimileCollections() {
    if (this.form.valid && !this.isProcessing) {
      const config: FacsimileCreationConfig = this.form.value;
      
      this.isProcessing = true;
      this.progressMessage = 'Creating facsimile collections…';
      this.creationSummary = null;

      const currentProject = this.projectService.getCurrentProject();
      
      this.facsimileService.createFacsimilesFromPublications(config, currentProject).pipe(
        take(1)
      ).subscribe({
        next: (summary: FacsimileCreationSummary) => {
          this.isProcessing = false;
          this.creationSummary = summary;
        },
        error: (error) => {
          this.isProcessing = false;
          console.error('Bulk creation failed:', error);
          this.snackbar.open(
            'Failed to create facsimile collections. Please try again.', 
            'Close', 
            { panelClass: ['snackbar-error'] }
          );
        }
      });
    }
  }

  navToFacsimileCollections() {
    this.router.navigate(['/facsimiles']);
  }

  getProgressPercentage(): number {
    if (!this.creationSummary) return 0;
    return Math.round((this.creationSummary.successful + this.creationSummary.failed) / this.creationSummary.total * 100);
  }
}
