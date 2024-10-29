import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { AddProjectData, EditProjectData, Project, ProjectResponse } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  selectedProject$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  fileTree$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private apiService: ApiService) {
    if (localStorage.getItem('selected_project')) {
      this.selectedProject$.next(localStorage.getItem('selected_project'));
    }
  }

  getProjects(): Observable<Project[]> {
    if (!this.apiService.environment) {
      return new Observable<Project[]>();
    }
    const url = `${this.apiService.prefixedUrl}/projects/list/`;
    return this.apiService.get(url).pipe(
      map((response: ProjectResponse) => {
        return response.data;
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

  getFileTree(): Observable<any> {
    if (!this.fileTree$.value) {
      this.getProjectFileTree().subscribe((fileTree) => {
        this.fileTree$.next(fileTree);
      });
    }
    return this.fileTree$;
  }

  getProjectFileTree() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/get_tree/`;
        return this.apiService.get(url);
      }),
      catchError(() => of([]))
    );
  }

  setSelectedProject(project: string | null) {
    this.selectedProject$.next(project);
    localStorage.setItem('selected_project', project || '');
  }

}
