import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PublicationService } from '../../services/publication.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, of, switchMap, combineLatest, from, mergeMap, finalize } from 'rxjs';
import { PublicationAddRequest, PublicationCollection, XmlMetadata } from '../../models/publication';
import { MatIconModule } from '@angular/material/icon';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FileTreeComponent } from '../../components/file-tree/file-tree.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Published, PublishedOptions } from '../../models/common';
import { MatSelectModule } from '@angular/material/select';
import { MatDivider } from '@angular/material/divider';
import { LoadingService } from '../../services/loading.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

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
  standalone: true,
  imports: [
    CommonModule, MatIconModule, RouterLink, ReactiveFormsModule, MatButtonModule, FileTreeComponent,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDivider, LoadingSpinnerComponent
  ],
  templateUrl: './publication-bundle.component.html',
  styleUrl: './publication-bundle.component.scss'
})
export class PublicationBundleComponent implements OnInit {
  gettingMetadata = false;
  loading$;
  selectedProject$;
  publicationCollectionId$: Observable<string | null>;
  publicationCollections$: Observable<PublicationCollection[]> = of([]);
  selectedPublicationCollection$: Observable<PublicationCollection | undefined> = of(undefined);
  publishedOptions = PublishedOptions;
  defaultPublished = Published.PublishedInternally;
  saveFailures: string[] = [];

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

  constructor(
      private publicationService: PublicationService,
      private route: ActivatedRoute,
      private snackbar: MatSnackBar,
      private loadingService: LoadingService,
      private router: Router
  ) {
    this.loading$ = this.loadingService.loading$;
    this.selectedProject$ = this.publicationService.selectedProject$;
    this.publicationCollectionId$ = this.route.paramMap.pipe(map(params => params.get('collectionId')));
  }

  ngOnInit() {
    this.publicationCollections$ = this.selectedProject$.pipe(
      switchMap(() => this.publicationService.getPublicationCollections())
    );
    this.selectedPublicationCollection$ = combineLatest([this.publicationCollections$, this.publicationCollectionId$]).pipe(
      map(([collections, id]) => collections.find(collection => collection.id === parseInt(id as string)))
    );
  }

  selectedFiles(filePaths: string[]) {
    this.saveFailures = [];
    this.files.clear();
    for (const filePath of filePaths) {
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

  readMetadata() {
    const concurrentRequests = 5;
    this.gettingMetadata = true;
    const throttledData$ = from(this.files.controls).pipe(
      mergeMap((row) => this.getRowMetadata(row), concurrentRequests),
      finalize(() => {
        this.gettingMetadata = false;
      })
    );

    throttledData$.subscribe({
      complete: () => {
        this.snackbar.open('All metadata received', 'Close', { panelClass: 'snackbar-success' });
      },
    });
  }

  getRowMetadata(row: FormGroup<BundleFormType>) {
    return new Observable<void>(observer => {
      const originalFilename = row.get('original_filename')!.value;
      this.publicationService.getMetadataFromXML(originalFilename)
        .subscribe({
          next: (metadata: XmlMetadata) => {
            for (const key in metadata) {
              if (Object.prototype.hasOwnProperty.call(metadata, key)) {
                const control = row.get(key);
                const value = metadata[key as keyof XmlMetadata];
                if (control && !!value && !control.value) {
                  control.setValue(value);
                }
              }
            }
            observer.next();
            observer.complete();
          },
          error: () => {
            observer.next();
            observer.complete();
          }
        });
    });
  }

  onSubmit(collectionId: string) {
    const concurrentRequests = 5;
    const throrrledRequests$ = from(this.files.controls).pipe(
      mergeMap((row) => this.addPublication(row, parseInt(collectionId)), concurrentRequests)
    );

    throrrledRequests$.subscribe({
      complete: () => {
        this.snackbar.open('All publications added', 'Close', { panelClass: 'snackbar-success' });
        this.clearForm();
        if (this.saveFailures.length === 0) {
          this.router.navigate(['../'], { relativeTo: this.route });
        }
      },
    });
  }

  addPublication(row: FormGroup<BundleFormType>, collectionId: number) {
    return new Observable<void>(observer => {
      const data = row.getRawValue() as PublicationAddRequest;
      data.published = this.bundleForm.value.published as Published;
      this.publicationService.addPublication(collectionId, data)
        .subscribe({
          next: () => {
            observer.next();
            observer.complete();
          },
          error: () => {
            this.saveFailures.push(data.original_filename as string);
            observer.next();
            observer.complete();
          },
        });
    });
  }


}
