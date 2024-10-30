import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { FacsimileCollection, FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest, FacsimileCollectionResponse } from '../models/facsimile';
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
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
        return this.apiService.get(url).pipe(
          map((response: FacsimileCollectionResponse) => response.data)
        );
      }
    ));
  }

  getFacsimileCollection(collectionId: number): Observable<FacsimileCollection> {
    // /<project>/facsimiles/collections/<facsimile_collection_ids>
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/collections/${collectionId}`;
        return this.apiService.get(url).pipe(
          map((response: FacsimileCollection[]) => response[0])
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
    // "/<project>/facsimiles/<collection_id>/<number>/<zoom_level>"
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        return this.apiService.get(url).pipe(
          catchError(err => of(err))
        )
      }
    ));
  }

  getFacsimileImagePath(collectionId: number, pageNumber: number, zoomLevel: 1|2|3|4 = 1) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      map(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/${collectionId}/${pageNumber}/${zoomLevel}`;
        return url.replace('/testing/', 'https://api.sls.fi/');
      })
    );
  }

  uploadFacsimileFile(collectionId: number, pageNumber: number, formData: FormData) {
    // /<project>/facsimiles/<collection_id>/<page_number>
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/${collectionId}/${pageNumber}`;
        return this.apiService.post(url, formData, { reportProgress: true, observe: 'events', context: new HttpContext().set(SkipLoading, true) });
      }
    ));
  }

}
