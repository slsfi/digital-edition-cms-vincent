import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounce, distinctUntilChanged, filter, map, Observable, shareReplay, startWith, Subject, switchMap, timer } from 'rxjs';
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
import { allCommentsColumnData, allFacsimileColumnData, allManuscriptColumnsData, allPublicationColumnsData, allVersionColumnsData, commentsColumnData, facsimileColumnData, manuscriptColumnsData, publicationColumnsData, versionColumnsData } from './columns';

@Component({
  selector: 'publications',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent,
    FileTreeComponent, MatCardModule, MatBadgeModule, CustomTableComponent, CustomTableComponent
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
  publicationsLoader$: Subject<void> = new Subject<void>();
  publications$: Observable<Publication[]> = new Observable<Publication[]>();
  publicationId$: Observable<string | null> = new Observable<string | null>();
  selectedPublication$: Observable<Publication | null> = new Observable<Publication | null>();
  private publicationsSource = new BehaviorSubject<Publication[]>([]);
  publicationsResult$: Observable<Publication[]> = this.publicationsSource.asObservable();
  publicationColumnsData = publicationColumnsData;
  allPublicationColumnsData = allPublicationColumnsData;
  // VERSIONS
  versionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  versions$: Observable<Version[]> = new Observable<Version[]>();
  private versionsSource = new BehaviorSubject<Version[]>([]);
  versionsResult$: Observable<Version[]> = this.versionsSource.asObservable();
  versionColumnsData = versionColumnsData;
  allVersionColumnsData = allVersionColumnsData;
  // MANUSCRIPTS
  manuscriptsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  manuscripts$: Observable<Manuscript[]> = new Observable<Manuscript[]>();
  private manuscriptsSource = new BehaviorSubject<Manuscript[]>([]);
  manuscriptsResult$: Observable<Manuscript[]> = this.manuscriptsSource.asObservable();
  manuscriptColumnsData = manuscriptColumnsData;
  allManuscriptColumnsData = allManuscriptColumnsData;
  // COMMENTS
  commentLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  comments$: Observable<PublicationComment[]> = new Observable<PublicationComment[]>();
  commentsColumnData = commentsColumnData
  allCommentsColumnData = allCommentsColumnData;
  // FACSIMILES
  facsimilesLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  facsimiles$: Observable<PublicationFacsimile[]> = new Observable<PublicationFacsimile[]>();
  private facsimilesSource = new BehaviorSubject<PublicationFacsimile[]>([]);
  facsimilesResult$: Observable<PublicationFacsimile[]> = this.facsimilesSource.asObservable();
  facsimileColumnData = facsimileColumnData;
  allFacsimileColumnData = allFacsimileColumnData;

  constructor(
    private publicationService: PublicationService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.loading$ = this.loadingService.loading$;
   }

  ngOnInit() {
    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;
    this.publicationCollectionId$ = this.route.paramMap.pipe(map(params => params.get('collectionId')));
    this.publicationId$ = this.route.paramMap.pipe(map(params => params.get('publicationId')));
    this.selectedProject$ = this.publicationService.selectedProject$;

    const publicationsShared$ = this.publicationsLoader$.pipe(
      startWith(void 0),
      debounce(() => timer(500)),
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$])
        .pipe(
          filter(([project, collectionId]) => collectionId != null),
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([project, collectionId]) => this.publicationService.getPublications(collectionId as string))
        )
      ),
      shareReplay(1)
    );

    this.publications$ = publicationsShared$;

    this.publications$.subscribe(publications => {
      this.publicationsSource.next(publications);
    });

    this.selectedPublication$ = combineLatest([this.publications$, this.publicationId$]).pipe(
      filter(([publications, publicationId]) => publicationId != null),
      map(([publications, publicationId]) => publications.find(publication => publication.id === parseInt(publicationId as string)) ?? null)
    );

    this.comments$ = this.commentLoader$.asObservable().pipe(
      startWith(0),
      debounce(() => timer(500)),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.publicationService.getCommentsForPublication(collectionId as string, publicationId as string))
        )
      )
    );

    this.versions$ = this.versionsLoader$.asObservable().pipe(
      startWith(0),
      debounce(() => timer(500)),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.publicationService.getVersionsForPublication(publicationId as string))
        )
      )
    );
    this.versions$.subscribe(versions => {
      this.versionsSource.next(versions);
    });

    this.manuscripts$ = this.manuscriptsLoader$.asObservable().pipe(
      startWith(0),
      debounce(() => timer(500)),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.publicationService.getManuscriptsForPublication(publicationId as string))
        )
      )
    );
    this.manuscripts$.subscribe(manuscripts => {
      this.manuscriptsSource.next(manuscripts);
    });

    this.facsimiles$ = this.facsimilesLoader$.asObservable().pipe(
      startWith(0),
      debounce(() => timer(500)),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.publicationService.getFacsimilesForPublication(publicationId as string))
        )
      )
    );
    this.facsimiles$.subscribe(facsimiles => {
      this.facsimilesSource.next(facsimiles);
    });

  }

  editPublication(publication: Publication | null = null, collectionId: string) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: publication ?? {},
        columns: this.allPublicationColumnsData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable),
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
            this.publicationsLoader$.next();
            this.snackbar.open('Publication saved', 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open('Error editing publication', 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      }
    });
  }

  editSelectedFileTable(type: 'text' | 'comment' | 'version' | 'manuscript', model: any, editId: number | null = null) {
    this.editSelectedFile(type, model.original_filename, editId ?? model.id);
  }

  editSelectedFile(type: 'text' | 'comment' | 'version' | 'manuscript', filename: string | null = '', editId: number) {
    const dialogRef = this.dialog.open(FileTreeComponent, {
      data: filename
    });

    dialogRef.afterClosed().subscribe(result => {

      if (!result) {
        return;
      }
      const filePath = result.join('/');


      const succesMessage = 'Filename saved';
      const errorMessage = 'Error editing filename';
      const data = { original_filename: filePath }
      if (type === 'text') {
        this.publicationService.editPublication(editId, data).subscribe({
          next: () => {
            this.publicationsLoader$.next();
            this.snackbar.open(succesMessage, 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open(errorMessage, 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      } else if (type === 'comment') {
        this.publicationService.editComment(editId, data).subscribe({
          next: () => {
            this.commentLoader$.next(0);
            this.snackbar.open(succesMessage, 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open(errorMessage, 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      } else if (type === 'version') {
        this.publicationService.editVersion(editId, data).subscribe({
          next: () => {
            this.versionsLoader$.next(0);
            this.snackbar.open(succesMessage, 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open(errorMessage, 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      } else if (type === 'manuscript') {
        this.publicationService.editManuscript(editId, data).subscribe({
          next: () => {
            this.manuscriptsLoader$.next(0);
            this.snackbar.open(succesMessage, 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open(errorMessage, 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      }
    });
  }

  editVersion(version: Version | null, publicationId: number) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: version ?? {},
        columns: this.allVersionColumnsData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable),
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
          error: () => {
            this.snackbar.open('Error editing version', 'Close', { panelClass: ['snackbar-error'] });
          }

        });
      }
    });
  }

  editManuscript(manuscript: Manuscript | null, publicationId: number) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: manuscript ?? {},
        columns: this.allManuscriptColumnsData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable),
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
          },
          error: () => {
            this.snackbar.open('Error editing manuscript', 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      }
    });
  }

  editComment(comment: PublicationComment | null, publicationId: number) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: comment ?? {},
        columns: this.allCommentsColumnData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable),
        title: 'Comment'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let req;
        if (comment?.id) {
          req = this.publicationService.editComment(publicationId, result.form.value);
        } else {
          req = this.publicationService.editComment(publicationId, result.form.value);
        }
        req.subscribe({
          next: () => {
            this.commentLoader$.next(0);
            this.snackbar.open('Comment saved', 'Close', { panelClass: ['snackbar-success'] });
          },
          error: () => {
            this.snackbar.open('Error editing comment', 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      }
    });
  }

  editFacsimile(facsimile: PublicationFacsimile | null, publicationId: number) {
    const columns = this.allFacsimileColumnData
      .filter(column => column.type !== 'action')
      .sort((a: any, b: any) => b.editable - a.editable)
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: {
        model: facsimile ?? {},
        columns,
        title: 'Facsimile',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();
        columns.forEach(column => {
          if (column.type === 'number') {
            payload[column.field] = Number(payload[column.field]);
          }
        });

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
          },
          error: () => {
            this.snackbar.open('Error editing facsimile', 'Close', { panelClass: ['snackbar-error'] });
          }
        });
      }
    });
  }

  filter() {
    const columns = this.publicationColumnsData.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      width: '250px',
      data: columns
    });
  }

  sort() {
    const columns = this.publicationColumnsData.filter(column => column.field !== 'action');
    this.dialog.open(TableSortingComponent, {
      width: '250px',
      data: columns
    });
  }
}
