import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { filter, map, Observable, switchMap } from 'rxjs';
import { Person, PersonPayload, PersonResponse } from '../models/person';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {

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

  getSubjects(projectName: string | null | undefined): Observable<Person[]> {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/subjects/list/`;
    return this.apiService.get<PersonResponse>(url).pipe(
      map(response => response.data),
    );
  }

  addSubject(payload: PersonPayload, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/subjects/new/`;
    return this.apiService.post<Person>(url, payload);
  }

  editSubject(id: number, payload: PersonPayload, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/subjects/${id}/edit/`;
    return this.apiService.post<Person>(url, payload);
  }

  // Legacy method for reactive updates on home page
  getSubjectsForCurrentProject(): Observable<Person[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => this.getSubjects(project))
    );
  }
}
