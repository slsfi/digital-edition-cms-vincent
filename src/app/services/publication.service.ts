import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import {
  LinkTextToPublicationRequest, Manuscript, ManuscriptEditRequest, ManuscriptRequest, ManuscriptResponse, Publication, PublicationAddRequest,
  PublicationCollection, PublicationCollectionAddRequest, PublicationCollectionEditRequest, PublicationCollectionResponse,
  PublicationComment, PublicationCommentRequest, PublicationCommentResponse, PublicationEditRequest, PublicationResponse,
  Version, VersionEditRequest, VersionResponse
} from '../models/publication';
import {
  EditPublicationFacsimileRequest, LinkPublicationToFacsimileRequest, PublicationFacsimile, PublicationFacsimileResponse
 } from '../models/facsimile';

@Injectable({
  providedIn: 'root'
})
export class PublicationService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  getPublicationCollections(): Observable<PublicationCollection[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/list/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationCollectionResponse) => response.data)
        );
      }
    ));
  }

  editPublicationCollection(collectionId: number, data: PublicationCollectionEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/edit/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  addPublicationCollection(data: PublicationCollectionAddRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/new/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  getPublication(publicationId: number): Observable<Publication> {
    // /<project>/publication/<publication_id>
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}`;
        return this.apiService.get(url).pipe(
          map((response: Publication[]) => response[0])
        );
      }
    ));
  }

  getPublications(collectionId: string): Observable<Publication[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationResponse) => response.data)
        );
      }
    ));
  }

  editPublication(publicationId: number, data: PublicationEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  addPublication(collectionId: number,data: PublicationAddRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/new/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  linkTextToPublication(publicationId: number, payload: LinkTextToPublicationRequest) {
    // /<project>/publication/<publication_id>/link_text/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/link_text/`;
        return this.apiService.post(url, payload);
      }),
      catchError(() => of())
    );
  }

  getCommentsForPublication(collectionId: string, publicationId: string): Observable<PublicationComment[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comments/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationCommentResponse) => response.data)
        )
      }),
      catchError(() => of([]))
    );
  }

  editComment(publicationId: number, data: PublicationCommentRequest) {
    // /<project>/publication/<publication_id>/comment/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comment/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  getVersionsForPublication(publicationId: string): Observable<Version[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/versions/`;
        return this.apiService.get(url).pipe(
          map((response: VersionResponse) => response.data)
        );
      }),
      catchError(() => of([]))
    );
  }

  editVersion(versionId: number, data: VersionEditRequest) {
    // /<project>/versions/<version_id>/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/versions/${versionId}/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  getManuscriptsForPublication(publicationId: string): Observable<Manuscript[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/manuscripts/`;
        return this.apiService.get(url).pipe(
          map((response: ManuscriptResponse) => response.data)
        );
      }),
      catchError(() => of([] as Manuscript[]))
    );
  }

  editManuscript(manuscriptId: number, data: ManuscriptEditRequest) {
    // /<project>/manuscripts/<manuscript_id>/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/manuscripts/${manuscriptId}/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  getFacsimilesForPublication(publicationId: string): Observable<PublicationFacsimile[]> {
    // /<project>/publication/<publication_id>/facsimiles/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/facsimiles/`;
        return this.apiService.get(url).pipe(map((response: PublicationFacsimileResponse) => response.data));
      }),
      catchError(() => of([]))
    );
  }

  editFacsimileForPublication(data: EditPublicationFacsimileRequest) {
    // /<project>/facsimile_collection/facsimile/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/facsimile/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  linkFacsimileToPublication(facsimileCollectionId: number, data: LinkPublicationToFacsimileRequest) {
    // /<project>/facsimile_collection/<collection_id>/link/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${facsimileCollectionId}/link/`;
        return this.apiService.post(url, data);
      })
    );
  }

}
