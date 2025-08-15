import { ProjectService } from './project.service';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { filter, map, switchMap } from 'rxjs';
import { TranslationRequest, TranslationRequestPost, TranslationResponse, TranslationsResponse } from '../models/translation';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  private validateProject(projectName: string | null | undefined): string | never {
    if (!projectName) {
      throw new Error('Project name is required');
    }
    return projectName;
  }


  addTranslation(payload: TranslationRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/translation/new/`;
    return this.apiService.post<TranslationResponse>(url, payload);
  }

  editTranslation(translation_id: number, payload: TranslationRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/edit/`;
    return this.apiService.post<TranslationResponse>(url, payload);
  }

  getTranslations(translation_id: number, data: TranslationRequestPost, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/list/`;
    return this.apiService.post<TranslationsResponse>(url, data).pipe(
      map(response => response.data)
    );
  }

  // Legacy method for reactive updates on home page
  getTranslationsForCurrentProject(translation_id: number, data: TranslationRequestPost) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => this.getTranslations(translation_id, data, project))
    );
  }
}
