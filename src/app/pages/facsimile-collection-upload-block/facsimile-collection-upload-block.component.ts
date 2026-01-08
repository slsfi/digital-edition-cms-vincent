import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, finalize, take } from 'rxjs';

import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { FacsimileCollection, VerifyFacsimileFileResponse } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { RangeArrayPipe } from '../../pipes/range-array.pipe';

@Component({
  selector: 'facsimile-collection-upload-block',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FileUploadComponent,
    LoadingSpinnerComponent,
    RangeArrayPipe
  ],
  templateUrl: './facsimile-collection-upload-block.component.html',
  styleUrl: './facsimile-collection-upload-block.component.scss'
})
export class FacsimileCollectionUploadBlockComponent implements OnInit {
  private readonly facsimileService = inject(FacsimileService);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  collectionId: number = this.route.snapshot.params['id'];
  facsimile$: Observable<FacsimileCollection> = new Observable<FacsimileCollection>();
  loadingFacsData = signal<boolean>(true);
  missingFileNumbers = signal<number[]>([]);
  missingFileNumbersOrig = signal<number[]>([]);
  mode: string = this.route.snapshot.params['mode'];
  project: string | null = this.projectService.getCurrentProject();
  uploadCompleted = signal<boolean>(false);

  ngOnInit() {
    this.facsimile$ = this.facsimileService.getFacsimileCollection(
      this.collectionId,
      this.project
    ).pipe(
      finalize(() => this.loadingFacsData.set(false))
    );
    if (this.mode === 'upload-missing') {
      this.verifyFacsimileFiles(true);
    }
  }

  verifyFacsimileFiles(setOrig = false) {
    this.facsimileService.verifyFacsimileFile(this.collectionId, 'all', this.project).pipe(
      take(1)
    ).subscribe({
      next: response => {
        this.missingFileNumbers.set(response.data?.missing_file_numbers || []);
        if (setOrig) {
          this.missingFileNumbersOrig.set(this.missingFileNumbers());
        }
      },
      error: (error: HttpErrorResponse) => {
        const err: VerifyFacsimileFileResponse = error.error;
        this.missingFileNumbers.set(err.data?.missing_file_numbers || []);
        if (setOrig) {
          this.missingFileNumbersOrig.set(this.missingFileNumbers());
        }
      }
    });
  }

  returnNav(facsCollId?: number | null): void {
    const routeSegments = facsCollId ? ['/facsimiles', facsCollId] : ['/facsimiles'];
    this.router.navigate(
      routeSegments,
      { queryParamsHandling: 'preserve' }
    );
  }

  uploadComplete(): void {
    if (this.mode === 'upload-missing') {
      this.verifyFacsimileFiles();
    }
    this.uploadCompleted.set(true);
  }

}
