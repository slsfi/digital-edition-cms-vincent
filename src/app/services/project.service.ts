import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';
import { Person } from '../models/person';
import { Publication } from '../models/publication';
import { Facsimile } from '../models/facsimile';
import { Project } from '../models/project';

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
    const url = `${this.apiService.getPrefixedUrl()}/projects`;
    return this.apiService.get(url).pipe(
      map((projects: Project[]) => {
        const userProjects = (localStorage.getItem('user_projects') || '').split(',');
        if (userProjects.length) {
          return projects.filter(project => userProjects.includes(project.name));
        }
        return projects;
      })
    );;
  }

  setSelectedProject(project: string | null) {
    this.$selectedProject.next(project);
    localStorage.setItem('selected_project', project || '');
  }

  getFacsimiles(): Observable<Facsimile[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.getPrefixedUrl()}/${project}/facsimile_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getPublications(): Observable<Publication[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.getPrefixedUrl()}/${project}/publication_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getSubjects(): Observable<Person[]> {
    return this.$selectedProject.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.getPrefixedUrl()}/${project}/subjects`;
        return this.apiService.get(url);
      }
    ));
  }

}
