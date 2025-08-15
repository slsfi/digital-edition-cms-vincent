import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap } from 'rxjs';

import { SkipLoading } from '../interceptors/loading.interceptor';
import {
  FacsimileCollection, FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest,
  FacsimileCollectionResponse, FacsimileCollectionsResponse, VerifyFacsimileFileResponse
} from '../models/facsimile';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class FacsimileService {
  selectedProject$: BehaviorSubject<string | null>;

  constructor(
    private apiService: ApiService,
    private projectService: ProjectService
  ) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  private validateProject(projectName: string | null | undefined): string | never {
    if (!projectName) {
      throw new Error('Project name is required');
    }
    return projectName;
  }

  getFacsimileCollections(projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/list/`;
    return this.apiService.get<FacsimileCollectionsResponse>(url).pipe(
      map(response => response.data)
    );
  }

  getFacsimileCollection(collectionId: number, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/collections/${collectionId}`;
    return this.apiService.get<FacsimileCollection[]>(url).pipe(
      map(response => response[0])
    );
  }

  addFacsimileCollection(data: FacsimileCollectionCreateRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/new/`;
    return this.apiService.post<FacsimileCollectionResponse>(url, data);
  }

  editFacsimileCollection(collectionId: number, data: FacsimileCollectionEditRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${collectionId}/edit/`;
    return this.apiService.post<FacsimileCollectionResponse>(url, data);
  }

  verifyFacsimileFile(collectionId: number, fileNr: number | string, projectName: string | null | undefined, zoomLevel: 1|2|3|4 = 1) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/verify-facsimile-file/${collectionId}/${fileNr}/${zoomLevel}`;
    return this.apiService.get<VerifyFacsimileFileResponse>(url, {}, true);
  }

  getFacsimileImagePath(collectionId: number, pageNumber: number, projectName: string | null | undefined, zoomLevel: 1|2|3|4 = 1) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/get-single-facsimile-file/${collectionId}/${pageNumber}/${zoomLevel}`
    return url;
  }

  uploadFacsimileFile(collectionId: number, pageNumber: number, formData: FormData, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/${collectionId}/${pageNumber}`;
    return this.apiService.post(url, formData, { reportProgress: true, observe: 'events', context: new HttpContext().set(SkipLoading, true) });
  }

  // Legacy method for reactive updates on home page
  getFacsimileCollectionsForCurrentProject() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => this.getFacsimileCollections(project))
    );
  }

}
