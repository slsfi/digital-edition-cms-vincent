import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';
import { Person, PersonPayload } from '../models/person';
import { Publication } from '../models/publication';
import { Facsimile } from '../models/facsimile';
import { AddProjectData, EditProjectData, Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  $selectedProject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private apiService: ApiService) {
    if (localStorage.getItem('selected_project')) {
      this.$selectedProject.next(localStorage.getItem('selected_project'));
    }
  }

  getProjects(): Observable<Project[]> {
    const url = `${this.apiService.prefixedUrl}/projects/`;
    return this.apiService.get(url).pipe(
      map((projects: Project[]) => {
        const userProjects = (localStorage.getItem('user_projects') || '').split(',');
        if (userProjects.length) {
          return projects.filter(project => userProjects.includes(project.name));
        }
        return projects;
      })
    );
  }

  addProject(payload: AddProjectData) {
    const url = `${this.apiService.prefixedUrl}/projects/new/`;
    return this.apiService.post(url, payload);
  }

  editProject(id: number, payload: EditProjectData) {
    const url = `${this.apiService.prefixedUrl}/projects/${id}/edit/`;
    return this.apiService.post(url, payload);
  }

  setSelectedProject(project: string | null) {
    this.$selectedProject.next(project);
    localStorage.setItem('selected_project', project || '');
  }

  getFacsimiles(): Observable<Facsimile[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getPublications(): Observable<Publication[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getSubjects(): Observable<Person[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects`;
        return this.apiService.get(url);
      }
    ));
  }

  addSubject(payload: PersonPayload): Observable<Person> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects/new/`;
        return this.apiService.post(url, payload);
      })
    );
  }

  editSubject(id: number, payload: PersonPayload): Observable<Person> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects/${id}/edit/`;
        return this.apiService.post(url, payload);
      })
    );
  }

}
