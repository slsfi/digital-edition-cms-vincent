import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ManuscriptResponse, Publication, PublicationCollection, PublicationComment, ReadingText, Version } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';


@Component({
  selector: 'app-publications',
  standalone: true,
  imports: [CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss'
})
export class PublicationsComponent {
  publicationCollectionColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number' },
    { field: 'title', header: 'Title', type: 'string' },
    { field: 'published', header: 'Published', type: 'published' },
    { field: 'actions', header: 'Actions', type: 'action' },
  ];
  publicationCollectionDisplayedColumns: string[] = this.publicationCollectionColumnsData.map(column => column.field);


  publicationColumnsData: Column[] = [
    { field: 'id', header: 'ID', type: 'number' },
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'published', header: 'Published', type: 'published' },
    { field: 'actions', header: 'Actions', type: 'action' },
  ];
  publicationDisplayedColumns: string[] = this.publicationColumnsData.map(column => column.field);


  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();

  publications$: Observable<Publication[]> = new Observable<Publication[]>();
  publicationId$: Observable<string | null> = new Observable<string | null>();

  readingText$: Observable<ReadingText> = new Observable<ReadingText>();
  comments$: Observable<PublicationComment[]> = new Observable<PublicationComment[]>();
  versions$: Observable<Version[]> = new Observable<Version[]>();
  manuscripts$: Observable<ManuscriptResponse> = new Observable<ManuscriptResponse>();

  constructor(private projectService: ProjectService, private route: ActivatedRoute) { }

  ngOnInit() {
    const paramMap$ = this.route.paramMap.pipe();

    this.publicationCollectionId$ = paramMap$.pipe(
      map(params => params.get('collectionId'))
    );

    this.publicationId$ = paramMap$.pipe(
      map(params => params.get('publicationId'))
    );

    this.selectedProject$ = this.projectService.selectedProject$;
    this.publicationCollections$ = combineLatest([this.selectedProject$, this.projectService.getPublicationCollections()])
      .pipe(map(([project, publications]) => publications));

    this.publications$ = this.publicationCollectionId$.pipe(
      filter((collectionId) => collectionId != null),
      switchMap(collectionId => this.projectService.getPublications(collectionId))
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

}
