import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { FacsimileCollection, FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest, FacsimileCollectionResponse, VerifyFacsimileFileResponse } from '../models/facsimile';
import { filter, map, Observable, switchMap } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { SkipLoading } from '../interceptors/loading.interceptor';

@Injectable({
  providedIn: 'root'
})
export class FacsimileService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  getFacsimileCollections(): Observable<FacsimileCollection[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/list/`;
        return this.apiService.get<FacsimileCollectionResponse>(url).pipe(
          map(response => response.data)
        );
      }
    ));
  }

  getFacsimileCollection(collectionId: number): Observable<FacsimileCollection> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/collections/${collectionId}`;
        return this.apiService.get<FacsimileCollection[]>(url).pipe(
          map(response => response[0])
        );
      }
    ));
  }

  addFacsimileCollection(data: FacsimileCollectionCreateRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/new/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  editFacsimileCollection(collectionId: number, data: FacsimileCollectionEditRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${collectionId}/edit/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  getFacsimileFile(url: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(() => {
        return this.apiService.get(url)
      }
    ));
  }

  verifyFacsimileFile(collectionId: number, fileNr: number | string, zoomLevel: 1|2|3|4 = 1) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/verify-facsimile-file/${collectionId}/${fileNr}/${zoomLevel}`;
        return this.apiService.get<VerifyFacsimileFileResponse>(url, {}, true);
      }
    ));
  }

  getFacsimileImagePath(collectionId: number, pageNumber: number, zoomLevel: 1|2|3|4 = 1): string {
    const project = this.selectedProject$.getValue();
    const url = `${this.apiService.prefixedUrl}/${project}/get-single-facsimile-file/${collectionId}/${pageNumber}/${zoomLevel}`
    return url;
  }

  uploadFacsimileFile(collectionId: number, pageNumber: number, formData: FormData) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/${collectionId}/${pageNumber}`;
        return this.apiService.post(url, formData, { reportProgress: true, observe: 'events', context: new HttpContext().set(SkipLoading, true) });
      }
    ));
  }

}
