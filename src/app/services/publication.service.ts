import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, Observable, shareReplay, switchMap } from 'rxjs';

import {
  EditPublicationFacsimileRequest, LinkFacsimileToPublicationResponse,
  LinkPublicationToFacsimileRequest, PublicationFacsimileResponse
} from '../models/facsimile';
import {
  LinkTextToPublicationRequest, LinkTextToPublicationResponse, ManuscriptEditRequest,
  ManuscriptResponse, ManuscriptsResponse, Publication, PublicationAddRequest,
  PublicationCollection, PublicationCollectionAddRequest, PublicationCollectionEditRequest,
  PublicationCollectionResponse, PublicationCollectionsResponse, PublicationCommentRequest,
  PublicationCommentResponse, PublicationCommentsResponse, PublicationEditRequest,
  PublicationResponse, PublicationsResponse, VersionEditRequest, VersionResponse,
  VersionsResponse, XmlMetadataResponse
} from '../models/publication';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class PublicationService {
  selectedProject$: BehaviorSubject<string | null>;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  private validateProject(projectName: string | null | undefined): string | never {
    if (!projectName) {
      throw new Error('Project name is required');
    }
    return projectName;
  }

  getPublicationCollections(projectName: string | null | undefined): Observable<PublicationCollection[]> {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/list/name/asc/`;
    return this.apiService.get<PublicationCollectionsResponse>(url).pipe(
      map(response => response.data),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  editPublicationCollection(collectionId: number, data: PublicationCollectionEditRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/edit/`;
    return this.apiService.post<PublicationCollectionResponse>(url, data);
  }

  addPublicationCollection(data: PublicationCollectionAddRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/new/`;
    return this.apiService.post<PublicationCollectionResponse>(url, data);
  }

  getPublication(publicationId: number, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}`;
    return this.apiService.get<Publication[]>(url).pipe(
      map(response => response[0])
    );
  }

  getPublications(
    collectionId: string,
    projectName: string | null | undefined,
    disableErrorMessage = false,
    orderBy = 'id'
  ) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/${orderBy}/`;
    return this.apiService.get<PublicationsResponse>(url, {}, disableErrorMessage).pipe(
      map(response => response.data)
    );
  }

  editPublication(publicationId: number, data: PublicationEditRequest, projectName: string | null | undefined, disableErrorMessage = false) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/edit/`;
    return this.apiService.post<PublicationResponse>(url, data, {}, disableErrorMessage);
  }

  addPublication(collectionId: number, data: PublicationAddRequest, projectName: string | null | undefined, disableErrorMessage = false) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/new/`;
    return this.apiService.post<PublicationResponse>(url, data, {}, disableErrorMessage);
  }

  linkTextToPublication(publicationId: number, payload: LinkTextToPublicationRequest, projectName: string | null | undefined, disableErrorMessage = false) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/link_text/`;
    return this.apiService.post<LinkTextToPublicationResponse>(url, payload, {}, disableErrorMessage);
  }

  getCommentsForPublication(collectionId: string, publicationId: string, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comments/`;
    return this.apiService.get<PublicationCommentsResponse>(url).pipe(
      map(response => response.data)
    );
  }

  editComment(publicationId: number, data: PublicationCommentRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comment/edit/`;
    return this.apiService.post<PublicationCommentResponse>(url, data);
  }

  getVersionsForPublication(publicationId: string, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/versions/`;
    return this.apiService.get<VersionsResponse>(url).pipe(
      map(response => response.data)
    );
  }

  editVersion(versionId: number, data: VersionEditRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/versions/${versionId}/edit/`;
    return this.apiService.post<VersionResponse>(url, data);
  }

  getManuscriptsForPublication(publicationId: string, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/manuscripts/`;
    return this.apiService.get<ManuscriptsResponse>(url).pipe(
      map(response => response.data)
    );
  }

  editManuscript(manuscriptId: number, data: ManuscriptEditRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/manuscripts/${manuscriptId}/edit/`;
    return this.apiService.post<ManuscriptResponse>(url, data);
  }

  getFacsimilesForPublication(publicationId: string, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/facsimiles/`;
    return this.apiService.get<PublicationFacsimileResponse>(url).pipe(map(response => response.data));
  }

  editFacsimileForPublication(data: EditPublicationFacsimileRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/facsimile/edit/`;
    return this.apiService.post<LinkFacsimileToPublicationResponse>(url, data);
  }

  linkFacsimileToPublication(facsimileCollectionId: number, data: LinkPublicationToFacsimileRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${facsimileCollectionId}/link/`;
    return this.apiService.post<LinkFacsimileToPublicationResponse>(url, data);
  }

  getMetadataFromXML(xmlPath: string, projectName: string | null | undefined, disableErrorMessage = false) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/get_metadata_from_xml/by_path/${xmlPath}`;
    return this.apiService.get<XmlMetadataResponse>(url, {}, disableErrorMessage).pipe(
      map(response => response.data)
    );
  }

  // Legacy method for reactive updates on home page
  getPublicationCollectionsForCurrentProject() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => this.getPublicationCollections(project))
    );
  }

}
