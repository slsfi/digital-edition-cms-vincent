import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { TranslationRequest, TranslationRequestPost, TranslationResponse } from '../models/person';
import { ApiService } from './api.service';
import { filter, map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }


  addTranslation(payload: TranslationRequest) {
    // /<project>/translation/new/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translation/new/`;
        return this.apiService.post(url, payload);
      })
    );
  }

  editTranslation(translation_id: number, payload: TranslationRequest) {
    // /<project>/translations/<translation_id>/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/edit/`;
        return this.apiService.post(url, payload);
      })
    );
  }

  getTranslations(translation_id: number, data: TranslationRequestPost): Observable<any> {
    // /<project>/translations/<translation_id>/list/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/list/`;
        return this.apiService.post(url, data).pipe(
          map((response: TranslationResponse) => response.data)
        );
      })
    );
  }
}
