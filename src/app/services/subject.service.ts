import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { Person, PersonPayload, PersonResponse } from '../models/person';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {

  selectedProject$;

  constructor(private apiService: ApiService, private projectService: ProjectService) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  getSubjects(): Observable<Person[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects/list/`;
        return this.apiService.get(url).pipe(
          map((response: PersonResponse) => response.data),
        )
      })
    );
  }

  addSubject(payload: PersonPayload): Observable<Person> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects/new/`;
        return this.apiService.post(url, payload);
      })
    );
  }

  editSubject(id: number, payload: PersonPayload): Observable<Person> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects/${id}/edit/`;
        return this.apiService.post(url, payload);
      })
    );
  }
}
