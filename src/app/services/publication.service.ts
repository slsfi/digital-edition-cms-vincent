import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { filter, map, Observable, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import {
  LinkTextToPublicationRequest, Manuscript, ManuscriptEditRequest, ManuscriptResponse, Publication, PublicationAddRequest,
  PublicationCollection, PublicationCollectionAddRequest, PublicationCollectionEditRequest, PublicationCollectionResponse,
  PublicationComment, PublicationCommentRequest, PublicationCommentResponse, PublicationEditRequest, PublicationResponse,
  Version, VersionEditRequest, VersionResponse, XmlMetadataResponse
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
      }),
    );
  }

  editPublicationCollection(collectionId: number, data: PublicationCollectionEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/edit/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  addPublicationCollection(data: PublicationCollectionAddRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/new/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  getPublication(publicationId: number): Observable<Publication> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}`;
        return this.apiService.get(url).pipe(
          map((response: Publication[]) => response[0])
        );
      }),
    );
  }

  getPublications(collectionId: string): Observable<Publication[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationResponse) => response.data)
        );
      }),
    );
  }

  editPublication(publicationId: number, data: PublicationEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/edit/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  addPublication(collectionId: number,data: PublicationAddRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/new/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  linkTextToPublication(publicationId: number, payload: LinkTextToPublicationRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/link_text/`;
        return this.apiService.post(url, payload);
      }),
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
    );
  }

  editComment(publicationId: number, data: PublicationCommentRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comment/edit/`;
        return this.apiService.post(url, data);
      }),
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
    );
  }

  editVersion(versionId: number, data: VersionEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/versions/${versionId}/edit/`;
        return this.apiService.post(url, data);
      }),
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
    );
  }

  editManuscript(manuscriptId: number, data: ManuscriptEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/manuscripts/${manuscriptId}/edit/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  getFacsimilesForPublication(publicationId: string): Observable<PublicationFacsimile[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/facsimiles/`;
        return this.apiService.get(url).pipe(map((response: PublicationFacsimileResponse) => response.data));
      }),
    );
  }

  editFacsimileForPublication(data: EditPublicationFacsimileRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/facsimile/edit/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  linkFacsimileToPublication(facsimileCollectionId: number, data: LinkPublicationToFacsimileRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${facsimileCollectionId}/link/`;
        return this.apiService.post(url, data);
      }),
    );
  }

  getMetadataFromXML(xmlPath: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/get_metadata_from_xml/by_path/${xmlPath}`;
        return this.apiService.get(url).pipe(
          map((response: XmlMetadataResponse) => response.data)
        );
      }),
    );
  }

}
