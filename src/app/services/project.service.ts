import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, filter, Observable, Subject, switchMap } from 'rxjs';
import { Person } from '../models/person';
import { Publication } from '../models/publication';
import { Facsimile } from '../models/facsimile';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  $selectedProject: BehaviorSubject<Project | null> = new BehaviorSubject<Project | null>(null);

  constructor(private apiService: ApiService) {
    if (localStorage.getItem('selected_project')) {
      this.$selectedProject.next(JSON.parse(localStorage.getItem('selected_project') || ''));
    }
  }

  getProjects(): Observable<Project[]> {
    const url = `${this.apiService.getPrefixedUrl()}/projects`;
    return this.apiService.get(url);
  }

  setSelectedProject(project: Project | null) {
    this.$selectedProject.next(project);
    localStorage.setItem('selected_project', JSON.stringify(project));
  }

  getFacsimiles(): Observable<Facsimile[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.getPrefixedUrl()}/${project.name}/facsimile_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getPublications(): Observable<Publication[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.getPrefixedUrl()}/${project.name}/publication_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getSubjects(): Observable<Person[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.getPrefixedUrl()}/${project.name}/subjects`;
        return this.apiService.get(url);
      }
    ));
  }

}
