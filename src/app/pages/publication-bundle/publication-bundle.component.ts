import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule,
         Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, combineLatest, finalize, from, map, mergeMap,
         Observable, of, switchMap, take, tap, toArray} from 'rxjs';

import { FileTreeComponent } from '../../components/file-tree/file-tree.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { Published, PublishedOptions } from '../../models/common.model';
import { LinkTextToPublicationRequest, PublicationAddRequest, PublicationCollection,
         PublicationResponse, XmlMetadata } from '../../models/publication.model';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { SnackbarService } from '../../services/snackbar.service';


interface BundleFormType {
  original_filename: FormControl<string>;
  name: FormControl<string>;
  published: FormControl<Published>;
  language: FormControl<string | null>;
  genre: FormControl<string | null>;
  publication_comment_id: FormControl<number | null>;
  legacy_id: FormControl<string | null>;
  original_publication_date: FormControl<string | null>;
}

@Component({
  selector: 'publication-bundle',
  imports: [
    CommonModule, FormsModule, MatIconModule, RouterLink,
    ReactiveFormsModule, MatButtonModule, FileTreeComponent,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatDivider, MatTooltipModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './publication-bundle.component.html',
  styleUrl: './publication-bundle.component.scss'
})
export class PublicationBundleComponent implements OnInit {
  private readonly publicationService = inject(PublicationService);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackbar = inject(SnackbarService);
  private readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);

  gettingMetadata = false;
  loading$ = this.loadingService.loading$;
  project: string | null = null;
  publicationCollectionId$: Observable<string | null> = this.route.paramMap.pipe(
    map(params => params.get('collectionId'))
  );
  publicationCollections$: Observable<PublicationCollection[]> = of([]);
  selectedPublicationCollection$: Observable<PublicationCollection | undefined> = of(undefined);
  publishedOptions = PublishedOptions;
  defaultPublished = Published.PublishedInternally;
  saveFailures: string[] = [];
  metadataFailures: string[] = [];
  addMsBoolean = false;
  existingFilePaths = new Set<string>();

  bundleForm = new FormGroup({
    published: new FormControl(Published.PublishedInternally, Validators.required),
    files: new FormArray<FormGroup<BundleFormType>>([], Validators.required)
  });

  get files() {
    return this.bundleForm.get('files') as FormArray<FormGroup<BundleFormType>>;
  }

  get publishedStatus() {
    const value = this.bundleForm.get('published')!.value;
    return this.publishedOptions.find(option => option.value === value)?.label;
  }

  ngOnInit() {
    this.project = this.projectService.getCurrentProject();
    if (!this.project) {
      return;
    }

    this.publicationCollections$ = this.publicationService.getPublicationCollections(this.project);

    this.selectedPublicationCollection$ = combineLatest([
      this.publicationCollections$,
      this.publicationCollectionId$
    ]).pipe(
      map(([collections, id]) => collections.find(
        collection => collection.id === Number(id as string)
      ))
    );

    // Get a list of all publications already in the collection, so we can filter
    // them out and not add them again.
    this.publicationCollectionId$.pipe(
      switchMap((collectionId) => {
        if (!collectionId) {
          return of([]);
        }
        return this.publicationService.getPublications(collectionId, this.project);
      }),
      take(1)
    ).subscribe((pubs) => {
      this.existingFilePaths.clear();
      pubs.forEach(p => {
        if (p.original_filename) {
          this.existingFilePaths.add(p.original_filename);
        }
      });
    });
  }

  selectedFiles(filePaths: string[]) {
    this.saveFailures = [];
    this.files.clear();

    const skipped: string[] = [];

    for (const filePath of filePaths) {
      if (this.existingFilePaths.has(filePath)) {
        skipped.push(filePath);
        continue; // don’t add a row for already added publications
      }

      this.files.push(new FormGroup<BundleFormType>({
        original_filename: new FormControl({ value: filePath, disabled: true }, { validators: Validators.required, nonNullable: true}),
        name: new FormControl('', { validators: Validators.required , nonNullable: true }),
        published: new FormControl(this.defaultPublished, { validators: Validators.required, nonNullable: true }),
        language: new FormControl(null),
        genre: new FormControl(null),
        publication_comment_id: new FormControl(null),
        legacy_id: new FormControl(null),
        original_publication_date: new FormControl(null),
      }));
    }

    if (skipped.length) {
      if (skipped.length === filePaths.length) {
        this.snackbar.show(`All ${filePaths.length} XML files in the folder have already been added as publications to the collection. Unable to add them again.`, 'error');

        // Clear local form state and navigate back to the collection page
        this.clearForm();
        this.router.navigate(['../'], { relativeTo: this.route });
      } else {
        this.snackbar.show(`Skipped ${skipped.length} / ${filePaths.length} XML files that have already been added as publications to the collection.`, 'info');
        console.log('Skipped XML files: ', skipped);
      }
    }
  }

  clearForm() {
    this.files.clear();
    this.bundleForm.patchValue({ published: this.defaultPublished });
  }

  publishedChanged() {
    const val = this.bundleForm.value.published as Published;
    this.files.controls.forEach(row => {
      row.get('published')!.setValue(val);
    });
  }

  getMetadataFromXMLAll() {
    this.metadataFailures = [];
    this.gettingMetadata = true;
    let progressSnackbarRef: MatSnackBarRef<SimpleSnackBar> | null = null;

    if (this.files.controls.length > 40) {
      progressSnackbarRef = this.snackbar.show('Fetching metadata from XML files…', 'info');
    }

    const concurrentRequests = 1;
    from(this.files.controls.map((row, index) => ({ row, index }))).pipe(
      mergeMap(({ row, index }) => {
        const originalFilename = row.get('original_filename')!.value;

        return this.publicationService.getMetadataFromXML(originalFilename, this.project).pipe(
          take(1),
          tap((metadata: XmlMetadata) => {
            for (const key in metadata) {
              if (Object.prototype.hasOwnProperty.call(metadata, key)) {
                const control = row.get(key);
                const value = metadata[key as keyof XmlMetadata];
                if (control && !!value && !control.value) {
                  control.setValue(value);
                }
              }
            }
          }),
          catchError(err => {
            console.error(`Failed to fetch metadata from ${originalFilename}:`, err);
            // eslint-disable-next-line no-irregular-whitespace -- allow NBSP and newline for visual alignment in snackbar
            this.metadataFailures.push(`# ${index + 1}. ${originalFilename}`);
            return of(null); // Continue the stream
          })
        );
      }, concurrentRequests),
      toArray(),
      finalize(() => {
        this.gettingMetadata = false;
        progressSnackbarRef?.dismiss();
      })
    ).subscribe({
      next: () => {
        if (this.metadataFailures.length === 0) {
          this.snackbar.show('Successfully fetched metadata from all files.');
        } else if (this.metadataFailures.length < this.files.controls.length) {
          this.snackbar.show(
            // eslint-disable-next-line no-irregular-whitespace -- allow NBSP and newline for visual alignment in snackbar
            `Failed to fetch metadata from ${this.metadataFailures.length} / ${this.files.controls.length} file(s):\n${this.metadataFailures.join('\n')}`, 'warning');
        } else {
          this.snackbar.show('Failed to fetch metadata from all files.', 'error');
        }
      }
    });
  }

  removeRow(index: number) {
    this.files.removeAt(index);
  }

  savePublications(collectionId: string) {
    this.saveFailures = [];
    // concurrentRequests = 1 ensures that the publications are added sequentially in
    // the order they appear in the UI
    const concurrentRequests = 1;
    const throttledRequests$ = from(this.files.controls).pipe(
      mergeMap((row) => this.addPublication(row, parseInt(collectionId)), concurrentRequests)
    );

    throttledRequests$.subscribe({
      complete: () => {
        const total = this.files.controls.length;
        const failed = this.saveFailures.length;

        if (failed === 0) {
          this.snackbar.show('Successfully added all publications.');
        } else {
          this.snackbar.show(`Failed to add ${failed} / ${total} publications from the following files:\n${this.saveFailures.join(', ')}`, 'error');
        }

        // Clear local form state and always navigate back to the collection page
        this.clearForm();
        this.router.navigate(['../'], { relativeTo: this.route });
      },
    });
  }

  /**
   * Adds a publication to the specified collection by calling the backend API.
   * 
   * If the `addMsBoolean` flag is enabled and the added publication includes a valid
   * `original_filename`, a manuscript text will also be linked to the newly created
   * publication via a secondary API call.
   * 
   * All operations are handled reactively using RxJS, and errors are caught to allow
   * the overall publication process to continue even if individual inserts fail.
   * 
   * @param row - A FormGroup containing the publication metadata to be submitted.
   * @param collectionId - The ID of the publication collection to add the publication to.
   * @returns An Observable that completes when the publication (and optionally the manuscript link)
   *          has been processed. Emits no data, but handles success or failure internally.
   */
  addPublication(row: FormGroup<BundleFormType>, collectionId: number): Observable<void> {
    if (!this.project) {
      return of(void 0);
    }

    const data = row.getRawValue() as PublicationAddRequest;
    data.published = this.bundleForm.value.published as Published;

    return this.publicationService.addPublication(collectionId, data, this.project).pipe(
      take(1),
      switchMap((response: PublicationResponse) => {
        const pub = response.data;

        // Skip linking if addMsBoolean is false or original_filename is missing
        if (!this.addMsBoolean || !pub.original_filename) {
          return of(void 0);
        }

        const manuscriptPayload: LinkTextToPublicationRequest = {
          text_type: 'manuscript',
          original_filename: pub.original_filename!,
          name: pub.name,
          published: pub.published,
          language: pub.language,
          sort_order: 1
        };

        // Also link a manuscript to the publication using the same data
        return this.publicationService.linkTextToPublication(
          pub.id, manuscriptPayload, this.project
        ).pipe(take(1));
      }),
      map(() => void 0),
      catchError((err) => {
        console.error(`Publication or manuscript linking failed for file ${data.original_filename}:`, err);
        this.saveFailures.push(data.original_filename as string);
        return of(void 0); // Allow continuation of the stream
      })
    );
  }

}
