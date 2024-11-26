import { ManuscriptResponse, PublicationCommentsResponse } from './../models/publication';
import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { filter, map, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import {
  LinkTextToPublicationRequest, LinkTextToPublicationResponse, ManuscriptEditRequest, ManuscriptsResponse, Publication, PublicationAddRequest,
  PublicationCollectionAddRequest, PublicationCollectionEditRequest, PublicationCollectionResponse, PublicationCollectionsResponse,
  PublicationCommentRequest, PublicationCommentResponse, PublicationEditRequest, PublicationResponse, PublicationsResponse, VersionEditRequest,
  VersionResponse, VersionsResponse, XmlMetadataResponse
} from '../models/publication';
import {
  EditPublicationFacsimileRequest, LinkFacsimileToPublicationResponse, LinkPublicationToFacsimileRequest, PublicationFacsimileResponse
} from '../models/facsimile';

@Injectable({
  providedIn: 'root'
})
export class PublicationService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  getPublicationCollections() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/list/name/asc/`;
        return this.apiService.get<PublicationCollectionsResponse>(url).pipe(
          map(response => response.data)
        );
      }),
    );
  }

  editPublicationCollection(collectionId: number, data: PublicationCollectionEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/edit/`;
        return this.apiService.post<PublicationCollectionResponse>(url, data);
      }),
    );
  }

  addPublicationCollection(data: PublicationCollectionAddRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/new/`;
        return this.apiService.post<PublicationCollectionResponse>(url, data);
      }),
    );
  }

  getPublication(publicationId: number) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}`;
        return this.apiService.get<Publication[]>(url).pipe(
          map(response => response[0])
        );
      }),
    );
  }

  getPublications(collectionId: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/`;
        return this.apiService.get<PublicationsResponse>(url).pipe(
          map(response => response.data)
        );
      }),
    );
  }

  editPublication(publicationId: number, data: PublicationEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/edit/`;
        return this.apiService.post<PublicationResponse>(url, data);
      }),
    );
  }

  addPublication(collectionId: number, data: PublicationAddRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/new/`;
        return this.apiService.post<PublicationResponse>(url, data);
      }),
    );
  }

  linkTextToPublication(publicationId: number, payload: LinkTextToPublicationRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/link_text/`;
        return this.apiService.post<LinkTextToPublicationResponse>(url, payload);
      }),
    );
  }

  getCommentsForPublication(collectionId: string, publicationId: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comments/`;
        return this.apiService.get<PublicationCommentsResponse>(url).pipe(
          map(response => response.data)
        )
      }),
    );
  }

  editComment(publicationId: number, data: PublicationCommentRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comment/edit/`;
        return this.apiService.post<PublicationCommentResponse>(url, data);
      }),
    );
  }

  getVersionsForPublication(publicationId: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/versions/`;
        return this.apiService.get<VersionsResponse>(url).pipe(
          map(response => response.data)
        );
      }),
    );
  }

  editVersion(versionId: number, data: VersionEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/versions/${versionId}/edit/`;
        return this.apiService.post<VersionResponse>(url, data);
      }),
    );
  }

  getManuscriptsForPublication(publicationId: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/manuscripts/`;
        return this.apiService.get<ManuscriptsResponse>(url).pipe(
          map(response => response.data)
        );
      }),
    );
  }

  editManuscript(manuscriptId: number, data: ManuscriptEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/manuscripts/${manuscriptId}/edit/`;
        return this.apiService.post<ManuscriptResponse>(url, data);
      }),
    );
  }

  getFacsimilesForPublication(publicationId: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/facsimiles/`;
        return this.apiService.get<PublicationFacsimileResponse>(url).pipe(map(response => response.data));
      }),
    );
  }

  editFacsimileForPublication(data: EditPublicationFacsimileRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/facsimile/edit/`;
        return this.apiService.post<LinkFacsimileToPublicationResponse>(url, data);
      }),
    );
  }

  linkFacsimileToPublication(facsimileCollectionId: number, data: LinkPublicationToFacsimileRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${facsimileCollectionId}/link/`;
        return this.apiService.post<LinkFacsimileToPublicationResponse>(url, data);
      }),
    );
  }

  getMetadataFromXML(xmlPath: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/get_metadata_from_xml/by_path/${xmlPath}`;
        return this.apiService.get<XmlMetadataResponse>(url).pipe(
          map(response => response.data)
        );
      }),
    );
  }

}
