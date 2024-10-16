import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { Manuscript, Publication, PublicationCollection, PublicationComment, Version } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { EditPublicationCollectionComponent } from '../edit-publication-collection/edit-publication-collection.component';
import { MatDialog } from '@angular/material/dialog';
import { EditPublicationComponent } from '../edit-publication/edit-publication.component';
import { FileTreeComponent } from "../file-tree/file-tree.component";

@Component({
  selector: 'publications',
  standalone: true,
  imports: [CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent, FileTreeComponent],
  providers: [DatePipe],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss'
})
export class PublicationsComponent {
  publicationColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number', editable: false },
    { field: 'name', header: 'Name', type: 'string', editable: true },
    { field: 'published', header: 'Published', type: 'published', editable: true },
    { field: 'actions', header: 'Actions', type: 'action', editable: false },
  ];
  allPublicationColumnsData: Column[] = [
    ...this.publicationColumnsData,
    { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
    { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
    { field: 'genre', header: 'Genre', type: 'string', editable: true },
    { field: 'language', header: 'Language', type: 'string', editable: true },
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: true },
    { field: 'original_filename', header: 'Original Filename', type: 'string', editable: true },
    { field: 'original_publication_date', header: 'Original Publication Date', type: 'date', editable: true },
    { field: 'publication_collection_id', header: 'Publication Collection ID', type: 'number', editable: false },
    { field: 'publication_comment_id', header: 'Publication Comment ID', type: 'number', editable: true },
    { field: 'published_by', header: 'Published By', type: 'string', editable: true },
  ];
  publicationDisplayedColumns: string[] = this.publicationColumnsData.map(column => column.field);

  loading$: Observable<boolean> = new Observable<boolean>();
  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();

  publicationsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  publications$: Observable<Publication[]> = new Observable<Publication[]>();
  publicationId$: Observable<string | null> = new Observable<string | null>();
  selectedPublication$: Observable<Publication | null> = new Observable<Publication | null>();

  commentsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  comments$: Observable<PublicationComment[]> = new Observable<PublicationComment[]>();
  versionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  versions$: Observable<Version[]> = new Observable<Version[]>();
  manuscriptsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  manuscripts$: Observable<Manuscript[]> = new Observable<Manuscript[]>();

  constructor(private projectService: ProjectService, private route: ActivatedRoute, private dialog: MatDialog) { }

  ngOnInit() {
    const paramMap$ = this.route.paramMap.pipe();

    this.publicationCollectionId$ = paramMap$.pipe(
      map(params => params.get('collectionId'))
    );

    this.publicationId$ = paramMap$.pipe(
      map(params => params.get('publicationId'))
    );

    this.selectedProject$ = this.projectService.selectedProject$;

    this.publications$ = this.publicationsLoader$.asObservable().pipe(
      startWith(null),
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$])
        .pipe(
          filter(([project, collectionId]) => collectionId != null),
          distinctUntilChanged(([prevProject, prevCollectionId], [nextProject, nextCollectionId]) => prevCollectionId === nextCollectionId),
          switchMap(([project, collectionId]) => this.projectService.getPublications(collectionId as string))
        )
      )
    );

    this.selectedPublication$ = combineLatest([this.publications$, this.publicationId$]).pipe(
      filter(([publications, publicationId]) => publicationId != null),
      map(([publications, publicationId]) => publications.find(publication => publication.id === parseInt(publicationId as string)) ?? null)
    );

    this.comments$ = this.commentsLoader$.asObservable().pipe(
      startWith(0),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.projectService.getCommentForPublication(collectionId as string, publicationId as string))
        )
      )
    );

    this.versions$ = this.versionsLoader$.asObservable().pipe(
      startWith(0),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.projectService.getVersionsForPublication(collectionId as string, publicationId as string))
        )
      )
    );

    this.manuscripts$ = this.manuscriptsLoader$.asObservable().pipe(
      startWith(0),
      switchMap(() => combineLatest([this.publicationCollectionId$, this.publicationId$])
        .pipe(
          filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
          distinctUntilChanged(([prevCollectionId, prevPublicationId], [nextCollectionId, nextPublicationId]) =>
            prevCollectionId === nextCollectionId && prevPublicationId === nextPublicationId
          ),
          switchMap(([collectionId, publicationId]) => this.projectService.getManuscriptsForPublication(collectionId as string, publicationId as string))
        )
      )
    );

  }

  editPublication(publication: Publication | null = null, collectionId: string = '') {
    const dialogRef = this.dialog.open(EditPublicationComponent, {
      width: '400px',
      data: {
        colectionId: collectionId,
        publication: publication ?? {},
        columns: this.allPublicationColumnsData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.publicationsLoader$.next(0);
      }
    });
  }

  editSelectedFile(type: 'text' | 'comment' | 'version' | 'manuscript', filename: string | null = '', editId: number) {
    const dialogRef = this.dialog.open(FileTreeComponent, {
      data: filename
    });

    dialogRef.afterClosed().subscribe(result => {

      if (!result) {
        return;
      }
      const filePath = result.join('/');

      if (type === 'text') {

        const data = { original_filename: filePath }
        this.projectService.editPublication(editId, data).subscribe(() => {
          this.publicationsLoader$.next(0);
        });

      } else if (type === 'comment') {
        const data = { filename: filePath }
        this.projectService.editComment(editId, data).subscribe(() => {
          this.commentsLoader$.next(0);
        });
      } else if (type === 'version') {
        const data = { filename: filePath }
        this.projectService.editVersion(editId, data).subscribe(() => {
          this.versionsLoader$.next(0);
        });
      } else if (type === 'manuscript') {
        const data = { filename: filePath }
        this.projectService.editManuscript(editId, data).subscribe(() => {
          this.manuscriptsLoader$.next(0);
        });
      }


    });
  }


}
