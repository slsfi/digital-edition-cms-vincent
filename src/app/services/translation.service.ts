import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { filter, map, Observable, switchMap } from 'rxjs';
import { Translation, TranslationRequest, TranslationRequestPost, TranslationResponse, TranslationsResponse } from '../models/translation';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }


  addTranslation(payload: TranslationRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translation/new/`;
        return this.apiService.post<TranslationResponse>(url, payload);
      })
    );
  }

  editTranslation(translation_id: number, payload: TranslationRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/edit/`;
        return this.apiService.post<TranslationResponse>(url, payload);
      })
    );
  }

  getTranslations(translation_id: number, data: TranslationRequestPost): Observable<Translation[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/list/`;
        return this.apiService.post<TranslationsResponse>(url, data).pipe(
          map(response => response.data)
        );
      })
    );
  }
}
