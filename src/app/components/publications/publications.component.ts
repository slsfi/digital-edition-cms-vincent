import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';
import { Manuscript, Publication, PublicationComment, Version } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { MatDialog } from '@angular/material/dialog';
import { FileTreeComponent } from "../file-tree/file-tree.component";
import { MatCardModule } from '@angular/material/card';
import { TableFiltersComponent } from '../table-filters/table-filters.component';
import { TableSortingComponent } from '../table-sorting/table-sorting.component';
import { QueryParamsService } from '../../services/query-params.service';
import { MatBadgeModule } from '@angular/material/badge';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomTableComponent } from "../custom-table/custom-table.component";
import { LoadingService } from '../../services/loading.service';
import { PublicationFacsimile } from '../../models/facsimile';
import { PublicationService } from '../../services/publication.service';
import {
  allCommentsColumnData, allFacsimileColumnData, allManuscriptColumnsData, allPublicationColumnsData, allVersionColumnsData,
  commentsColumnData, facsimileColumnData, manuscriptColumnsData, publicationColumnsData, versionColumnsData
} from './columns';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Deleted } from '../../models/common';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'publications',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent,
    FileTreeComponent, MatCardModule, MatBadgeModule, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss'
})
export class PublicationsComponent {
  loading$: Observable<boolean> = new Observable<boolean>();
  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);
  sortParams$: Observable<any[]> = new Observable<any[]>();
  filterParams$: Observable<any[]> = new Observable<any[]>();
  // PUBLICATIONS
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();
  publicationsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  publications$: Observable<Publication[]> = of([]);
  publicationId$: Observable<string | null> = new Observable<string | null>();
  selectedPublication$: Observable<Publication | null> = new Observable<Publication | null>();
  publicationColumnsData = publicationColumnsData;
  // VERSIONS
  versionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  versions$: Observable<Version[]> = of([]);
  versionColumnsData = versionColumnsData;
  // MANUSCRIPTS
  manuscriptsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  manuscripts$: Observable<Manuscript[]> = of([]);
  manuscriptColumnsData = manuscriptColumnsData;
  // COMMENTS
  commentLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  comments$: Observable<PublicationComment[]> = of([]);
  commentsColumnData = commentsColumnData
  // FACSIMILES
  facsimilesLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  facsimiles$: Observable<PublicationFacsimile[]> = new Observable<PublicationFacsimile[]>();
  facsimileColumnData = facsimileColumnData;

  isSmallScreen: boolean = false;

  constructor(
    private publicationService: PublicationService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.loading$ = this.loadingService.loading$;
    this.isSmallScreen = this.breakpointObserver.isMatched('(max-width: 960px)');
   }

  ngOnInit() {
    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;
    this.publicationCollectionId$ = this.route.paramMap.pipe(map(params => params.get('collectionId')));
    this.publicationId$ = this.route.paramMap.pipe(map(params => params.get('publicationId')));
    this.selectedProject$ = this.publicationService.selectedProject$;

    this.publications$ = this.publicationsLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$])
        .pipe(
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([project, collectionId]) => this.publicationService.getPublications(collectionId as string))
        )
      ),
    )

    this.selectedPublication$ = combineLatest([this.publications$, this.publicationId$]).pipe(
      map(([publications, publicationId]) => publications.find(publication => publication.id === parseInt(publicationId as string)) ?? null)
    );

    this.comments$ = this.commentLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([collectionId, publicationId]) => this.publicationService.getCommentsForPublication(collectionId as string, publicationId as string))
        )
      )
    );

    this.versions$ = this.versionsLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([collectionId, publicationId]) => this.publicationService.getVersionsForPublication(publicationId as string))
        )
      )
    );

    this.manuscripts$ = this.manuscriptsLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([collectionId, publicationId]) => this.publicationService.getManuscriptsForPublication(publicationId as string))
        )
      )
    );

    this.facsimiles$ = this.facsimilesLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([collectionId, publicationId]) => this.publicationService.getFacsimilesForPublication(publicationId as string))
        )
      )
    );

  }

  editPublication(publication: Publication | null = null, collectionId: string) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        model: publication ?? {},
        columns: allPublicationColumnsData,
        title: 'Publication'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let req;
        if (publication?.id) {
          req = this.publicationService.editPublication(publication.id, result.form.value);
        } else {
          req = this.publicationService.addPublication(parseInt(collectionId), result.form.value);
        }
        req.subscribe({
          next: () => {
            this.publicationsLoader$.next(0);
            if (result.form.value.cascade_published === true) {
              this.manuscriptsLoader$.next(0);
              this.versionsLoader$.next(0);
              this.commentLoader$.next(0);
            }
            this.snackbar.open('Publication saved', 'Close', { panelClass: ['snackbar-success'] });
          },
        });
      }
    });
  }

  editSelectedText(publication: Publication) {
    const dialogRef = this.dialog.open(FileTreeComponent, {
      data: publication.original_filename
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      const filePath = result.join('/');
      const data = { original_filename: filePath };

      this.publicationService.editPublication(publication.id, data).subscribe({
        next: () => {
          this.publicationsLoader$.next(0);
          this.snackbar.open('Filename saved', 'Close', { panelClass: ['snackbar-success'] });
        },
      });
    });
  }

  editVersion(version: Version | null, publicationId: number) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        model: version ?? {},
        columns: allVersionColumnsData,
        title: 'Version'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();
        payload['text_type'] = 'version';

        let req;
        if (version?.id) {
          req = this.publicationService.editVersion(version.id, payload);
        } else {
          req = this.publicationService.linkTextToPublication(publicationId, payload);
        }
        req.subscribe({
          next: () => {
            this.versionsLoader$.next(0);
            this.snackbar.open('Version saved', 'Close', { panelClass: ['snackbar-success'] });
          },
        });
      }
    });
  }

  editManuscript(manuscript: Manuscript | null, publicationId: number) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        model: manuscript ?? {},
        columns: allManuscriptColumnsData,
        title: 'Manuscript'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();
        payload['text_type'] = 'manuscript';

        let req;
        if (manuscript?.id) {
          req = this.publicationService.editManuscript(manuscript.id, payload);
        } else {
          req = this.publicationService.linkTextToPublication(publicationId, payload);
        }
        req.subscribe({
          next: () => {
            this.manuscriptsLoader$.next(0);
            this.snackbar.open('Manuscript saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  editComment(comment: PublicationComment | null, publicationId: number) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        model: comment ?? {},
        columns: allCommentsColumnData,
        title: 'Comment'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();
        payload['text_type'] = 'comment';
        let req;
        if (comment?.id) {
          req = this.publicationService.editComment(publicationId, payload);
        } else {
          req = this.publicationService.linkTextToPublication(publicationId, payload);
        }
        req.subscribe({
          next: () => {
            this.commentLoader$.next(0);
            this.snackbar.open('Comment saved', 'Close', { panelClass: ['snackbar-success'] });
          },
        });
      }
    });
  }

  editFacsimile(facsimile: PublicationFacsimile | null, publicationId: number) {
    const columns = allFacsimileColumnData
      .filter(column => column.type !== 'action')
      .sort((a: any, b: any) => b.editable - a.editable)
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        model: facsimile ?? {},
        columns,
        title: 'Facsimile',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();

        let req;
        if (facsimile?.id) {
          req = this.publicationService.editFacsimileForPublication(payload);
        } else {
          req = this.publicationService.linkFacsimileToPublication(publicationId, result.form);
        }
        req.subscribe({
          next: () => {
            this.facsimilesLoader$.next(0);
            this.snackbar.open('Facsimile saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  deleteFacsimile(facsimile: PublicationFacsimile) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this facsimile?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        const payload = { id: facsimile.id, deleted: Deleted.Deleted };
        this.publicationService.editFacsimileForPublication(payload).subscribe({
          next: () => {
            this.facsimilesLoader$.next(0);
            this.snackbar.open('Facsimile deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  deleteManuscript(manuscript: Manuscript) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this manuscript?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        const payload = { deleted: Deleted.Deleted };
        this.publicationService.editManuscript(manuscript.id, payload).subscribe({
          next: () => {
            this.manuscriptsLoader$.next(0);
            this.snackbar.open('Manuscript deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  deleteVersion(version: Version) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this version?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        const payload = { deleted: Deleted.Deleted };
        this.publicationService.editVersion(version.id, payload).subscribe({
          next: () => {
            this.versionsLoader$.next(0);
            this.snackbar.open('Version deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  deleteComment(comment: PublicationComment, publicationId: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to delete this comment?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        const payload = { deleted: Deleted.Deleted };
        this.publicationService.editComment(publicationId, payload).subscribe({
          next: () => {
            this.commentLoader$.next(0);
            this.snackbar.open('Comment deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });

        this.publicationService.editPublication(publicationId, { publication_comment_id: null }).subscribe({
          next: () => {
            this.publicationsLoader$.next(0);
          }
        });
      }
    });
  }

  deletePublication(publication: Publication) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        showCascadeBoolean: true,
        cascadeText: 'Also delete any comments, manuscripts or variants linked to the publication.',
        message: 'Are you sure you want to delete this publication?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        const payload = { deleted: Deleted.Deleted, cascade_deleted: result.cascadeBoolean };
        this.publicationService.editPublication(publication.id, payload).subscribe({
          next: () => {
            this.publicationsLoader$.next(0);
            this.snackbar.open('Publication deleted', 'Close', { panelClass: ['snackbar-success'] });
          },
        });
      }
    });
  }

  filter() {
    const columns = this.publicationColumnsData.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      data: columns
    });
  }

  sort() {
    this.dialog.open(TableSortingComponent, {
      data: this.publicationColumnsData
    });
  }
}
