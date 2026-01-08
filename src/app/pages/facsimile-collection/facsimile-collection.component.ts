import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, finalize, take, tap } from 'rxjs';

import { FacsimileCollection, VerifyFacsimileFileResponse } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'facsimile-collection',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './facsimile-collection.component.html',
  styleUrl: './facsimile-collection.component.scss'
})
export class FacsimileCollectionComponent implements OnInit {
  private readonly facsimileService = inject(FacsimileService);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);

  collectionId: number = this.route.snapshot.params['id'];
  facsimile$: Observable<FacsimileCollection> = new Observable<FacsimileCollection>();
  loadingFacsData = signal<boolean>(true);
  missingFileNumbers = signal<number[]>([]);
  missingFileSet = computed(() => new Set(this.missingFileNumbers()));
  numberOfPages = signal<number>(0);
  pageNumbers = computed(() =>
    Array.from({ length: this.numberOfPages() }, (_, i) => i + 1)
  );
  project: string | null = this.projectService.getCurrentProject();

  ngOnInit() {
    this.facsimile$ = this.facsimileService.getFacsimileCollection(
      this.collectionId,
      this.project
    ).pipe(
      tap((facsColl) => {
        this.numberOfPages.set(facsColl.number_of_pages ?? 0);
      }),
      finalize(() => this.loadingFacsData.set(false))
    );
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

}
