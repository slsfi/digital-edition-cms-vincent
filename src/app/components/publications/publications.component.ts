import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, concatMap,
         distinctUntilChanged, finalize, from, map, Observable, of,
         switchMap, take, tap, toArray } from 'rxjs';

import { allCommentsColumnData, allFacsimileColumnData, allManuscriptColumnsData,
         allPublicationColumnsData, allVersionColumnsData, commentsColumnData,
         facsimileColumnData, manuscriptColumnsData, publicationColumnsData,
         versionColumnsData } from './columns';
import { ConfirmDialogComponent, MetadataFieldOption } from '../confirm-dialog/confirm-dialog.component';
import { CustomTableComponent } from "../custom-table/custom-table.component";
import { EditDialogComponent, EditDialogData } from '../edit-dialog/edit-dialog.component';
import { FileTreeDialogComponent } from '../file-tree-dialog/file-tree-dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { TableFiltersComponent } from '../table-filters/table-filters.component';
import { TableSortingComponent } from '../table-sorting/table-sorting.component';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { QueryParamsService } from '../../services/query-params.service';
import { Column, Deleted } from '../../models/common';
import { LinkFacsimileToPublicationResponse, PublicationFacsimile } from '../../models/facsimile';
import { LinkTextToPublicationResponse, LinkTextToPublicationRequest, Manuscript,
         ManuscriptResponse, Publication, PublicationComment, PublicationCommentResponse,
         PublicationEditRequest, PublicationResponse, Version, VersionResponse,
         XmlMetadata } from '../../models/publication';
import { cleanEmptyStrings, cleanObject, shallowArrayEqual } from '../../utils/utility-functions';

@Component({
  selector: 'publications',
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule, RouterLink,
    LoadingSpinnerComponent, MatCardModule, MatBadgeModule, MatMenuModule,
    MatTooltipModule, CustomTableComponent
  ],
  providers: [DatePipe],
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.scss'
})
export class PublicationsComponent implements OnInit {
  loading$;
  selectedProject$;
  sortParams$;
  filterParams$;
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
  facsimiles$: Observable<PublicationFacsimile[]> = of([]);
  facsimileColumnData = facsimileColumnData;

  isSmallScreen = false;
  metadataUpdateFailures: number[] = [];
  metadataUpdating = false;

  // Metadata field configuration for selective updates
  private readonly METADATA_FIELDS: MetadataFieldOption[] = [
    { key: 'name', label: 'Publication name', defaultSelected: true },
    { key: 'original_publication_date', label: 'Date of origin', defaultSelected: true },
    { key: 'language', label: 'Language', defaultSelected: true },
    { key: 'genre', label: 'Genre', defaultSelected: true }
  ];

  constructor(
    private publicationService: PublicationService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private queryParamsService: QueryParamsService,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.loading$ = this.loadingService.loading$;
    this.selectedProject$ = this.publicationService.selectedProject$;
    this.isSmallScreen = this.breakpointObserver.isMatched('(max-width: 960px)');
    this.sortParams$ = this.queryParamsService.sortParams$;
    this.filterParams$ = this.queryParamsService.filterParams$;
  }

  ngOnInit() {
    this.publicationCollectionId$ = this.route.paramMap.pipe(
      map(params => params.get('collectionId'))
    );
    this.publicationId$ = this.route.paramMap.pipe(map(params => params.get('publicationId')));

    this.publications$ = this.publicationsLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$]).pipe(
        distinctUntilChanged(([, prevCollectionId], [, nextCollectionId]) => prevCollectionId === nextCollectionId),
        switchMap(([project, collectionId]) => {
          if (!project) { return of([]); }
          return this.publicationService.getPublications(collectionId as string, project);
        })
      ))
    );

    this.selectedPublication$ = combineLatest([this.publications$, this.publicationId$]).pipe(
      map(([publications, publicationId]) => publications.find(publication => publication.id === parseInt(publicationId as string)) ?? null)
    );

    this.comments$ = this.commentLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$, this.publicationId$]).pipe(
        distinctUntilChanged(shallowArrayEqual),
        switchMap(([project, collectionId, publicationId]) => {
          if (!project) { return of([]); }
          return this.publicationService.getCommentsForPublication(collectionId as string, publicationId as string, project);
        })
      ))
    );

    this.versions$ = this.versionsLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$, this.publicationId$]).pipe(
        distinctUntilChanged(shallowArrayEqual),
        switchMap(([project, , publicationId]) => {
          if (!project) { return of([]); }
          return this.publicationService.getVersionsForPublication(publicationId as string, project);
        })
      ))
    );

    this.manuscripts$ = this.manuscriptsLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$, this.publicationId$]).pipe(
        distinctUntilChanged(shallowArrayEqual),
        switchMap(([project, , publicationId]) => {
          if (!project) { return of([]); }
          return this.publicationService.getManuscriptsForPublication(publicationId as string, project);
        })
      ))
    );

    this.facsimiles$ = this.facsimilesLoader$.asObservable().pipe(
      switchMap(() => combineLatest([this.selectedProject$, this.publicationCollectionId$, this.publicationId$]).pipe(
        distinctUntilChanged(shallowArrayEqual),
        switchMap(([project, , publicationId]) => {
          if (!project) { return of([]); }
          return this.publicationService.getFacsimilesForPublication(publicationId as string, project);
        })
      ))
    );
  }

  editPublication(publication: Publication | null = null, collectionId: string) {
    const data: EditDialogData<Publication | object> = {
      model: publication,
      columns: allPublicationColumnsData,
      title: 'publication'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let request$: Observable<PublicationResponse>;
        const formValue = result.form.value;

        const currentProject = this.projectService.getCurrentProject();
        if (publication?.id) {
          request$ = this.publicationService.editPublication(publication.id, formValue, currentProject);
        } else {
          request$ = this.publicationService.addPublication(parseInt(collectionId), formValue, currentProject).pipe(
            switchMap((response: PublicationResponse) => {
              const pub = response.data;

              if (!formValue.link_manuscript || !pub.original_filename) {
                return of(response);
              }

              const manuscriptPayload: LinkTextToPublicationRequest = {
                text_type: 'manuscript',
                original_filename: pub.original_filename,
                name: pub.name,
                published: pub.published,
                language: pub.language,
                sort_order: 1
              };

              return this.publicationService.linkTextToPublication(pub.id, manuscriptPayload, currentProject).pipe(
                take(1),
                map(() => response)  // preserve the original response
              );
            })
          );
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.publicationsLoader$.next(0);
            if (formValue.cascade_published === true) {
              this.manuscriptsLoader$.next(0);
              this.versionsLoader$.next(0);
              this.commentLoader$.next(0);
            } else if (formValue.link_manuscript === true) {
              this.manuscriptsLoader$.next(0);
            }
            this.snackbar.open('Publication saved', 'Close', { panelClass: ['snackbar-success'] });
          },
          error: (err) => {
            console.error('Save failed:', err);
            this.publicationsLoader$.next(0);
            this.manuscriptsLoader$.next(0);
            this.versionsLoader$.next(0);
            this.commentLoader$.next(0);
          }
        });
      }
    });
  }

  editSelectedText(publication: Publication) {
    const dialogRef = this.dialog.open(FileTreeDialogComponent, {
      data: publication.original_filename
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      const filePath = result.join('/');
      const data = { original_filename: filePath };

      const currentProject = this.projectService.getCurrentProject();
      this.publicationService.editPublication(publication.id, data, currentProject).pipe(take(1)).subscribe({
        next: () => {
          this.publicationsLoader$.next(0);
          this.snackbar.open('File path saved', 'Close', { panelClass: ['snackbar-success'] });
        },
      });
    });
  }

  editVersion(version: Version | null, publicationId: number) {
    const data: EditDialogData<Version | object> = {
      model: version,
      columns: allVersionColumnsData,
      title: 'variant'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let payload = result.form.getRawValue();
        payload['text_type'] = 'version';

        let request$: Observable<VersionResponse | LinkTextToPublicationResponse>;
        const currentProject = this.projectService.getCurrentProject();
        if (version?.id) {
          // Edit existing variant
          // Convert empty strings in field values to null in the payload object
          payload = cleanEmptyStrings(payload);
          request$ = this.publicationService.editVersion(version.id, payload, currentProject);
        } else {
          // Add new variant
          // Remove empty fields from the payload object
          payload = cleanObject(payload);
          request$ = this.publicationService.linkTextToPublication(publicationId, payload, currentProject);
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.versionsLoader$.next(0);
            this.snackbar.open('Variant saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  editManuscript(manuscript: Manuscript | null, publicationId: number) {
    const data: EditDialogData<Manuscript | object> = {
      model: manuscript,
      columns: allManuscriptColumnsData,
      title: 'manuscript'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let payload = result.form.getRawValue();
        payload['text_type'] = 'manuscript';

        let request$: Observable<ManuscriptResponse | LinkTextToPublicationResponse>;
        const currentProject = this.projectService.getCurrentProject();
        if (manuscript?.id) {
          // Edit existing manuscript
          // Convert empty strings in field values to null in the payload object
          payload = cleanEmptyStrings(payload);
          request$ = this.publicationService.editManuscript(manuscript.id, payload, currentProject);
        } else {
          // Add new manuscript
          // Remove empty fields from the payload object
          payload = cleanObject(payload);
          request$ = this.publicationService.linkTextToPublication(publicationId, payload, currentProject);
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.manuscriptsLoader$.next(0);
            this.snackbar.open('Manuscript saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  editComment(comment: PublicationComment | null, publicationId: number) {
    const data: EditDialogData<PublicationComment> = {
      model: comment,
      columns: allCommentsColumnData,
      title: 'comment'
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let payload = result.form.getRawValue();
        payload['text_type'] = 'comment';

        let request$: Observable<PublicationCommentResponse | LinkTextToPublicationResponse>;
        const currentProject = this.projectService.getCurrentProject();
        if (comment?.id) {
          // Edit existing comment
          // Convert empty strings in field values to null in the payload object
          payload = cleanEmptyStrings(payload);
          request$ = this.publicationService.editComment(publicationId, payload, currentProject);
        } else {
          // Add new comment
          // Remove empty fields from the payload object
          request$ = this.publicationService.linkTextToPublication(publicationId, payload, currentProject);
        }
        request$.pipe(take(1)).subscribe({
          next: () => {
            this.commentLoader$.next(0);
            this.snackbar.open('Comment saved', 'Close', { panelClass: ['snackbar-success'] });
          }
        });
      }
    });
  }

  editFacsimile(facsimile: PublicationFacsimile | null, publicationId: number) {
    const columns = allFacsimileColumnData
      .filter(column => column.type !== 'action')
      .sort((a: Column, b: Column) => {
        return b.editable ? 1 : a.editable ? -1 : 0;
      })
    const data: EditDialogData<PublicationFacsimile> = {
      model: facsimile,
      columns,
      title: 'facsimile',
    }
    const dialogRef = this.dialog.open(EditDialogComponent, { data });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload = result.form.getRawValue();

        let request$: Observable<LinkFacsimileToPublicationResponse>;
        const currentProject = this.projectService.getCurrentProject();
        if (facsimile?.id) {
          request$ = this.publicationService.editFacsimileForPublication(payload, currentProject);
        } else {
          request$ = this.publicationService.linkFacsimileToPublication(publicationId, result.form, currentProject);
        }
        request$.pipe(take(1)).subscribe({
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
      if (result?.value) {
        const payload = { id: facsimile.id, deleted: Deleted.Deleted };
        const currentProject = this.projectService.getCurrentProject();
        this.publicationService.editFacsimileForPublication(payload, currentProject).pipe(take(1)).subscribe({
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
      if (result?.value) {
        const payload = { deleted: Deleted.Deleted };
        const currentProject = this.projectService.getCurrentProject();
        this.publicationService.editManuscript(manuscript.id, payload, currentProject).pipe(take(1)).subscribe({
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
        message: 'Are you sure you want to delete this variant?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        const payload = { deleted: Deleted.Deleted };
        const currentProject = this.projectService.getCurrentProject();
        this.publicationService.editVersion(version.id, payload, currentProject).pipe(take(1)).subscribe({
          next: () => {
            this.versionsLoader$.next(0);
            this.snackbar.open('Variant deleted', 'Close', { panelClass: ['snackbar-success'] });
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
      if (result?.value) {
        const payload = { deleted: Deleted.Deleted };
        const currentProject = this.projectService.getCurrentProject();
        this.publicationService.editComment(publicationId, payload, currentProject).pipe(take(1)).subscribe({
          next: () => {
            this.commentLoader$.next(0);
            this.snackbar.open('Comment deleted', 'Close', { panelClass: ['snackbar-success'] });
          }
        });

        this.publicationService.editPublication(publicationId, { publication_comment_id: null }, currentProject).pipe(take(1)).subscribe({
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
      if (result?.value) {
        const payload = { deleted: Deleted.Deleted, cascade_deleted: result.cascadeBoolean };
        const currentProject = this.projectService.getCurrentProject();
        this.publicationService.editPublication(publication.id, payload, currentProject).pipe(take(1)).subscribe({
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

  updateMetadataAll(collectionId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Update publications data from XML',
        message: 'This action fetches metadata of all publications in the collection from the reading-text XML files, and overwrites the data in the database with the fresh data from XML. Please observe that missing data in the XML files will result in empty field values in the database. Note that this action can’t be undone!',
        confirmText: 'Update',
        cancelText: 'Cancel',
        showMetadataFields: true,
        metadataFields: this.METADATA_FIELDS
      }
    });

    let progressSnackbarRef: MatSnackBarRef<SimpleSnackBar> | null = null;

    dialogRef.afterClosed().subscribe(result => {
      if (result?.value) {
        const selectedFields = result.selectedFields || {};
        
        // Filter metadata to only include selected fields
        const filterMetadata = (metadata: XmlMetadata): Partial<PublicationEditRequest> => {
          const filtered: Partial<PublicationEditRequest> = {};
          
          if (selectedFields['name']) {
            filtered.name = metadata.name;
          }
          if (selectedFields['original_publication_date']) {
            filtered.original_publication_date = metadata.original_publication_date;
          }
          if (selectedFields['language']) {
            filtered.language = metadata.language;
          }
          if (selectedFields['genre']) {
            filtered.genre = metadata.genre;
          }

          return filtered;
        };

        this.metadataUpdating = true;
        this.metadataUpdateFailures = [];

        const currentProject = this.projectService.getCurrentProject();
        this.publicationService.getPublications(collectionId, currentProject).pipe(
          take(1),
          tap((publications: Publication[]) => {
            if (publications.length > 40) {
              progressSnackbarRef = this.snackbar.open(
                'Updating metadata of all publications from XML…', 'Close',
                { panelClass: 'snackbar-info', duration: undefined }
              );
            }
          }),
          switchMap((publications: Publication[]) =>
            from(publications).pipe(
              concatMap((pub: Publication) => {
                if (!pub.original_filename) {
                  return of(null);
                }

                return this.publicationService.getMetadataFromXML(pub.original_filename, currentProject).pipe(
                  take(1),
                  switchMap((metadata: XmlMetadata) => {
                    const updateRequest: PublicationEditRequest = filterMetadata(metadata);
                    
                    // Only proceed if at least one field is selected
                    if (Object.keys(updateRequest).length === 0) {
                      return of(null);
                    }

                    return this.publicationService.editPublication(pub.id, updateRequest, currentProject).pipe(
                      take(1)
                    );
                  }),
                  catchError(err => {
                    console.error(`Metadata update failed for publication ID ${pub.id}:`, err);
                    this.metadataUpdateFailures.push(pub.id);
                    return of(null); // Continue with next publication
                  })
                );
              }),
              toArray(), // Collect all results to emit once all updates are done
              finalize(() => {
                this.metadataUpdating = false;
                progressSnackbarRef?.dismiss();
              })
            )
          )
        ).subscribe({
          next: (results) => {
            if (results.length === 0) {
              this.snackbar.open('No publications found in this collection.', 'Close', {
                panelClass: 'snackbar-info'
              });
            } else if (this.metadataUpdateFailures.length === 0) {
              this.snackbar.open(`Successfully updated metadata of all publications.`, 'Close', {
                panelClass: 'snackbar-success'
              });
              this.publicationsLoader$.next(0); // Refresh the list
            } else if (this.metadataUpdateFailures.length < results.length) {
              // eslint-disable-next-line no-irregular-whitespace -- allow NBSP and newline for visual alignment in snackbar
              this.snackbar.open(`Failed to update metadata of ${this.metadataUpdateFailures.length} / ${results.length} publication(s) with ID:\n${this.metadataUpdateFailures.join(", ")}`, 'Close', {
                panelClass: 'snackbar-warning',
                duration: undefined
              });
              this.publicationsLoader$.next(0); // Refresh the list
            } else {
              this.snackbar.open('Failed to update metadata of any publication.', 'Close', {
                panelClass: 'snackbar-error',
                duration: undefined
              });
            }
          },
          error: (err) => {
            console.error('Failed to fetch publications:', err);
            this.snackbar.open('Error fetching publication list.', 'Close', {
              panelClass: 'snackbar-error'
            });
          }
        });
      }
    });
  }

}
