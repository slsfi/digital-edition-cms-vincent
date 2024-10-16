import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { PublicationCollection } from '../../models/publication';
import { MatTableModule } from '@angular/material/table';
import { CustomDatePipe } from '../../pipes/custom-date.pipe';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EditPublicationCollectionComponent } from '../../components/edit-publication-collection/edit-publication-collection.component';
import { MatDialog } from '@angular/material/dialog';
import { PublicationsComponent } from "../../components/publications/publications.component";

@Component({
  selector: 'publication-collections',
  standalone: true,
  imports: [CommonModule, MatTableModule, CustomDatePipe, MatIconModule, MatButtonModule, RouterLink, LoadingSpinnerComponent, PublicationsComponent],
  providers: [DatePipe],
  templateUrl: './publication-collections.component.html',
  styleUrl: './publication-collections.component.scss'
})
export class PublicationCollectionsComponent {
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
    { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: false },
    { field: 'name_translation_id', header: 'Name Translation ID', type: 'string', editable: false },
    { field: 'project_id', header: 'Project ID', type: 'number', editable: false },
    { field: 'publication_collection_introduction_id', header: 'Publication Collection Introduction ID', type: 'number', editable: false },
    { field: 'title', header: 'Title', type: 'string', editable: false },
  ];
  publicationCollectionDisplayedColumns: string[] = this.publicationCollectionColumnsData.map(column => column.field);
  publicationCollectionsLoader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  selectedProject$: Observable<string | null> = new Observable<string | null>(undefined);

  publicationCollections$: Observable<PublicationCollection[]> = new Observable<PublicationCollection[]>();
  publicationCollectionId$: Observable<string | null> = new Observable<string | null>();

  selectedPublicationCollection$: Observable<PublicationCollection | null> = new Observable<PublicationCollection | null>();

  constructor(private projectService: ProjectService, private dialog: MatDialog, private route: ActivatedRoute) { }

  ngOnInit() {
    this.selectedProject$ = this.projectService.selectedProject$;

    this.publicationCollectionId$ = this.route.paramMap.pipe(
      map(params => params.get('collectionId'))
    );

    this.publicationCollections$ = this.publicationCollectionsLoader$.asObservable().pipe(
        startWith(null),
        switchMap(() => combineLatest([this.selectedProject$, this.projectService.getPublicationCollections()])
          .pipe(map(([project, publications]) => publications)))
    );

    this.selectedPublicationCollection$ = combineLatest([this.publicationCollections$, this.publicationCollectionId$]).pipe(
      filter(([publications, collectionId]) => collectionId != null),
      map(([publications, collectionId]) => publications.find(publication => publication.id === parseInt(collectionId as string)) ?? null)
    );

  }

  editPublicationCollection(publicationCollection: PublicationCollection | null = null) {
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
        this.publicationCollectionsLoader$.next(0);
      }
    });
  }

}
