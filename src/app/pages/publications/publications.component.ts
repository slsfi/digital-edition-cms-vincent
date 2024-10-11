import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ManuscriptResponse, Publication, PublicationCollection, PublicationComment, ReadingText, Version } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EditPublicationCollectionComponent } from '../../components/edit-publication-collection/edit-publication-collection.component';
import { MatDialog } from '@angular/material/dialog';
import { EditPublicationComponent } from '../../components/edit-publication/edit-publication.component';


@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent],
  providers: [DatePipe],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss'
})
export class PublicationsComponent {
  publicationCollectionColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number', editable: false },
    { field: 'name', header: 'Name', type: 'string', editable: true },
    { field: 'published', header: 'Published', type: 'published', editable: true },
    { field: 'actions', header: 'Actions', type: 'action', editable: false },
  ];
  allPublicationCollectionColumns: Column[] = [
    ...this.publicationCollectionColumnsData,
    { field: 'collection_intro_filename', header: 'Collection Intro Filename', type: 'string', editable: false },
    { field: 'collection_intro_published', header: 'Collection Intro Published', type: 'published', editable: false },
    { field: 'collection_title_filename', header: 'Collection Title Filename', type: 'string', editable: false },
    { field: 'collection_title_published', header: 'Collection Title Published', type: 'published', editable: false },
    { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
    { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
    { field: 'date_published_externally', header: 'Date Published Externally', type: 'date', editable: false },
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: false },
    { field: 'name_translation_id', header: 'Name Translation ID', type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', type: 'number', editable: false },
    { field: 'publication_collection_introduction_id', header: 'Publication Collection Introduction ID', type: 'number', editable: false },
    { field: 'title', header: 'Title', type: 'string', editable: false },
  ];
  publicationCollectionDisplayedColumns: string[] = this.publicationCollectionColumnsData.map(column => column.field);
  publicationCollectionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);


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
    { field: 'date_published_externally', header: 'Date Published Externally', type: 'date', editable: true },
    { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
    { field: 'genre', header: 'Genre', type: 'string', editable: true },
    { field: 'language', header: 'Language', type: 'string', editable: true },
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: true },
    { field: 'original_filename', header: 'Original Filename', type: 'string', editable: true },
    { field: 'original_publication_date', header: 'Original Publication Date', type: 'date', editable: true },
    { field: 'publication_collection_id', header: 'Publication Collection ID', type: 'number', editable: false },
    { field: 'publication_comment_id', header: 'Publication Comment ID', type: 'number', editable: true },
    { field: 'publication_group_id', header: 'Publication Group ID', type: 'number', editable: true },
    { field: 'published_by', header: 'Published By', type: 'string', editable: true },
    { field: 'zts_id', header: 'ZTS ID', type: 'string', editable: false },
  ];
  publicationDisplayedColumns: string[] = this.publicationColumnsData.map(column => column.field);

  loading$: Observable<boolean> = new Observable<boolean>();
  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();
  selectedPublicationCollection$: Observable<PublicationCollection | null> = new Observable<PublicationCollection | null>();

  publications$: Observable<Publication[]> = new Observable<Publication[]>();
  publicationId$: Observable<string | null> = new Observable<string | null>();
  selectedPublication$: Observable<Publication | null> = new Observable<Publication | null>();

  readingText$: Observable<ReadingText> = new Observable<ReadingText>();
  comments$: Observable<PublicationComment[]> = new Observable<PublicationComment[]>();
  versions$: Observable<Version[]> = new Observable<Version[]>();
  manuscripts$: Observable<ManuscriptResponse> = new Observable<ManuscriptResponse>();

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

    this.publicationCollections$ = this.publicationCollectionsLoader$.asObservable().pipe(
        startWith(null),
        switchMap(() => combineLatest([this.selectedProject$, this.projectService.getPublicationCollections()])
          .pipe(map(([project, publications]) => publications)))
    );

    this.selectedPublicationCollection$ = combineLatest([this.publicationCollections$, this.publicationCollectionId$]).pipe(
      filter(([publications, collectionId]) => collectionId != null),
      map(([publications, collectionId]) => publications.find(publication => publication.id === parseInt(collectionId as string)) ?? null)
    );

    this.publications$ = this.publicationCollectionId$.pipe(
      filter((collectionId) => collectionId != null),
      switchMap(collectionId => this.projectService.getPublications(collectionId))
    );

    this.selectedPublication$ = combineLatest([this.publications$, this.publicationId$]).pipe(
      filter(([publications, publicationId]) => publicationId != null),
      map(([publications, publicationId]) => publications.find(publication => publication.id === parseInt(publicationId as string)) ?? null)
    );

    this.readingText$ = combineLatest([this.publicationCollectionId$, this.publicationId$]).pipe(
      filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
      switchMap(([collectionId, publicationId]) => this.projectService.getReadingTextForPublication(collectionId as string, publicationId as string)),
    );

    this.comments$ = combineLatest([this.publicationCollectionId$, this.publicationId$]).pipe(
      filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
      switchMap(([collectionId, publicationId]) => this.projectService.getCommentForPublication(collectionId as string, publicationId as string)),
    );

    this.versions$ = combineLatest([this.publicationCollectionId$, this.publicationId$]).pipe(
      filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
      switchMap(([collectionId, publicationId]) => this.projectService.getVersionsForPublication(collectionId as string, publicationId as string)),
    );

    this.manuscripts$ = combineLatest([this.publicationCollectionId$, this.publicationId$]).pipe(
      filter(([collectionId, publicationId]) => collectionId != null && publicationId != null),
      switchMap(([collectionId, publicationId]) => this.projectService.getManuscriptsForPublication(collectionId as string, publicationId as string)),
    );
  }

  editPublicationCollection(publicationCollection: PublicationCollection | null = null) {
    console.log('Edit publication collection', publicationCollection);

    const dialogRef = this.dialog.open(EditPublicationCollectionComponent, {
      width: '400px',
      data: {
        collection: publicationCollection ?? {},
        columns: this.allPublicationCollectionColumns
          .filter(column => column.type !== 'action')
          .sort((a: any, b: any) => b.editable - a.editable)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // force publication collections to reload
        this.publicationCollectionsLoader$.next(0);
      }
    });
  }

  editPublication(publication: Publication | null = null, collectionId: string = '') {
    console.log('Edit publication', publication);

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
        // force publications to reload
      }
    });
  }


}
