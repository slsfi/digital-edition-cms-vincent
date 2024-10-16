import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, debounce, distinctUntilChanged, filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { Manuscript, Publication, PublicationComment, Version } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { MatDialog } from '@angular/material/dialog';
import { EditPublicationComponent } from '../edit-publication/edit-publication.component';
import { FileTreeComponent } from "../file-tree/file-tree.component";
import { MatCardModule } from '@angular/material/card';
import { EditVersionComponent } from '../edit-version/edit-version.component';
import { EditManuscriptComponent } from '../edit-manuscript/edit-manuscript.component';

@Component({
  selector: 'publications',
  standalone: true,
  imports: [CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent, FileTreeComponent, MatCardModule],
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

  commentLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  comment$: Observable<PublicationComment> = new Observable<PublicationComment>();
  versionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  versions$: Observable<Version[]> = new Observable<Version[]>();
  manuscriptsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  manuscripts$: Observable<Manuscript[]> = new Observable<Manuscript[]>();

  versionColumnsData: Column[] = [
    { field: 'name', 'header': 'Name', 'type': 'string', 'editable': true },
    { field: 'original_filename', 'header': 'Filename', 'type': 'string', 'editable': false },
    { field: 'actions', 'header': 'Actions', 'type': 'action', 'editable': false },
  ]
  versionDisplayedColumns: string[] = this.versionColumnsData.map(column => column.field);
  allVersionColumnsData: Column[] = [
    ...this.versionColumnsData,
    { field: 'published', header: 'Published', type: 'published', editable: true },
    { field: 'sort_order', header: 'Sort Order', type: 'number', editable: true },
    { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
    { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
    { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
    { field: 'section_id', header: 'Section ID', type: 'number', editable: false },
    { field: 'type', header: 'Type', type: 'number', editable: true },
    { field: 'id', header: 'ID', type: 'number', editable: false },

  ]

  manuscriptColumnsData: Column[] = [
    { field: 'name', 'header': 'Name', 'type': 'string', 'editable': true },
    { field: 'original_filename', 'header': 'Filename', 'type': 'string', 'editable': false },
    { field: 'actions', 'header': 'Actions', 'type': 'action', 'editable': false },
  ]
  manuscriptDisplayedColumns: string[] = this.manuscriptColumnsData.map(column => column.field);
  allManuscriptColumnsData: Column[] = [
    ...this.manuscriptColumnsData,
    { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
    { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
    { field: 'id', header: 'ID', type: 'number', editable: false },
    { field: 'language', header: 'Language', type: 'string', editable: false },
    { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
    { field: 'published', header: 'Published', type: 'published', editable: true },
    { field: 'section_id', header: 'Section ID', type: 'number', editable: false },
    { field: 'sort_order', header: 'Sort Order', type: 'number', editable: true },
  ]

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
      debounce(() => timer(500)),
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

    this.comment$ = this.commentLoader$.asObservable().pipe(
      startWith(0),
      debounce(() => timer(500)),
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
      debounce(() => timer(500)),
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
      debounce(() => timer(500)),
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
          this.commentLoader$.next(0);
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

  editVersion(version: Version | null, publicationId: number) {
    console.log('editVersion', version);
    const dialogRef = this.dialog.open(EditVersionComponent, {
      width: '400px',
      data: {
        version: version ?? {},
        publicationId,
        columns: this.allVersionColumnsData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('versions edit result', result);
      if (result === true) {
        this.versionsLoader$.next(0);
      }
    });
  }

  editManuscript(manuscript: Manuscript | null, publicationId: number) {
    console.log('editManuscript', manuscript);
    const dialogRef = this.dialog.open(EditManuscriptComponent, {
      width: '400px',
      data: {
        manuscript: manuscript ?? {},
        publicationId,
        columns: this.allManuscriptColumnsData
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('manuscript edit result', result);
      if (result === true) {
        this.manuscriptsLoader$.next(0);
      }
    });
  }
}
