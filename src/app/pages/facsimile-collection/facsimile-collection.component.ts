import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltip } from "@angular/material/tooltip";
import { finalize, take } from 'rxjs';

import { FacsimileCollection, FacsimileCollectionEditRequest, VerifyFacsimileFileResponse } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'facsimile-collection',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LoadingSpinnerComponent,
    MatTooltip
],
  templateUrl: './facsimile-collection.component.html',
  styleUrl: './facsimile-collection.component.scss'
})
export class FacsimileCollectionComponent implements OnInit {
  private static readonly integerValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '') {
      return null;
    }

    return Number.isInteger(Number(value)) ? null : { integer: true };
  };

  private readonly facsimileService = inject(FacsimileService);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly snackbar = inject(SnackbarService);

  collectionId: number = this.route.snapshot.params['id'];
  facsimileCollection = signal<FacsimileCollection | null>(null);
  loadingFacsData = signal<boolean>(true);
  savingNumberOfPages = signal<boolean>(false);
  missingFileNumbers = signal<number[]>([]);
  missingFileSet = computed(() => new Set(this.missingFileNumbers()));
  numberOfPages = signal<number>(0);
  numberOfPagesControl = new FormControl<number | null>(
    { value: null, disabled: true },
    {
      validators: [
        Validators.required,
        Validators.min(1),
        FacsimileCollectionComponent.integerValidator
      ]
    }
  );
  numberOfPagesInput = toSignal(this.numberOfPagesControl.valueChanges, {
    initialValue: this.numberOfPagesControl.value
  });
  numberOfPagesSaveEnabled = computed(() => {
    const facsimile = this.facsimileCollection();
    const newNumberOfPages = this.numberOfPagesInput();

    return !!facsimile
      && !this.savingNumberOfPages()
      && this.numberOfPagesControl.valid
      && newNumberOfPages !== null
      && newNumberOfPages !== facsimile.number_of_pages;
  });
  pageNumbers = computed(() =>
    Array.from({ length: this.numberOfPages() }, (_, i) => i + 1)
  );
  project: string | null = this.projectService.getCurrentProject();

  ngOnInit() {
    this.facsimileService.getFacsimileCollection(
      this.collectionId,
      this.project
    ).pipe(
      take(1),
      finalize(() => this.loadingFacsData.set(false))
    ).subscribe({
      next: (facsColl) => this.setFacsimileCollection(facsColl)
    });
    this.verifyFacsimileFiles();
  }

  verifyFacsimileFiles() {
    this.facsimileService.verifyFacsimileFile(
      this.collectionId,
      'all',
      this.project
    ).pipe(
      take(1)
    ).subscribe({
      next: response => {
        this.missingFileNumbers.set(response.data?.missing_file_numbers || []);
      },
      error: (error: HttpErrorResponse) => {
        const err: VerifyFacsimileFileResponse = error.error;
        this.missingFileNumbers.set(err.data?.missing_file_numbers || []);
      }
    });
  }

  saveNumberOfPages(facsimile: FacsimileCollection): void {
    if (!this.numberOfPagesSaveEnabled()) {
      return;
    }

    const newNumberOfPages = this.numberOfPagesControl.value;
    if (newNumberOfPages === null) {
      return;
    }

    const payload: FacsimileCollectionEditRequest = {
      title: facsimile.title,
      number_of_pages: newNumberOfPages,
      start_page_number: facsimile.start_page_number,
      description: facsimile.description,
      external_url: facsimile.external_url,
      deleted: facsimile.deleted
    };

    this.savingNumberOfPages.set(true);
    this.facsimileService.editFacsimileCollection(
      facsimile.id,
      payload,
      this.project
    ).pipe(
      take(1),
      finalize(() => this.savingNumberOfPages.set(false))
    ).subscribe({
      next: response => {
        this.setFacsimileCollection(response.data);
        this.verifyFacsimileFiles();
        this.snackbar.show('Number of images saved.');
      }
    });
  }

  private setFacsimileCollection(facsimile: FacsimileCollection): void {
    const numberOfPages = facsimile.number_of_pages ?? 0;

    this.facsimileCollection.set(facsimile);
    this.numberOfPages.set(numberOfPages);
    this.numberOfPagesControl.setValue(numberOfPages);
    this.numberOfPagesControl.markAsPristine();
    this.numberOfPagesControl.enable({ emitEvent: false });
  }

}
