import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
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

  //https://testa-api.sls.fi/digitaledition/topelius/facsimile_collection/list/
  getFacsimiles(): Observable<Facsimile[]> {
    const projectName = this.$selectedProject.value?.name;
    const url = `${this.apiService.getPrefixedUrl()}/${projectName}/facsimile_collection/list/`;
    return this.apiService.get(url);
  }

  //https://testa-api.sls.fi/digitaledition/topelius/publication_collection/list/
  getPublications(): Observable<Publication[]> {
    const projectName = this.$selectedProject.value?.name;
    const url = `${this.apiService.getPrefixedUrl()}/${projectName}/publication_collection/list/`;
    return this.apiService.get(url);
  }

  //https://testa-api.sls.fi/digitaledition/topelius/subjects/
  getSubjects(): Observable<Person[]> {
    const projectName = this.$selectedProject.value?.name;
    const url = `${this.apiService.getPrefixedUrl()}/${projectName}/subjects`;
    return this.apiService.get(url);
  }

}
