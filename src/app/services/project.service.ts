import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  $selectedProject: BehaviorSubject<any> = new BehaviorSubject<any>({});

  constructor(private apiService: ApiService, private authService: AuthService) {
    if (localStorage.getItem('selected_project')) {
      this.$selectedProject.next(JSON.parse(localStorage.getItem('selected_project') || '{}'));
    }
  }

  getProjects() {
    const url = `${this.apiService.getPrefixedUrl()}/projects`;
    return this.apiService.get(url);
  }

  setSelectedProject(project: any) {
    this.$selectedProject.next(project);
    localStorage.setItem('selected_project', JSON.stringify(project));
  }

  //https://testa-api.sls.fi/digitaledition/topelius/facsimile_collection/list/
  getFacsimiles() {
    console.log("getFacsimiles", this.$selectedProject.value);
    const projectName = this.$selectedProject.value.name;
    const url = `${this.apiService.getPrefixedUrl()}/${projectName}/facsimile_collection/list/`;
    console.log("getFacsimiles", url);
    return this.apiService.get(url);
  }
}
