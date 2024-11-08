import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, filter, map, Observable, switchMap, take } from 'rxjs';
import { AddProjectData, EditProjectData, FileTree, FileTreeResponse, Project, ProjectResponse, RepoDetails, RepoDetailsResponse } from '../models/project';
import { HttpContext } from '@angular/common/http';
import { SkipLoading } from '../interceptors/loading.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  selectedProject$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  fileTree$: BehaviorSubject<FileTree | null> = new BehaviorSubject<FileTree | null>(null);

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
    return this.apiService.get<ProjectResponse>(url).pipe(
      map(response => {
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

  getFileTree(): Observable<FileTree | null> {
    if (!this.fileTree$.value) {
      this.getProjectFileTree().pipe(take(1)).subscribe(fileTreeResponse => {
        this.fileTree$.next(fileTreeResponse.data);
      });
    }
    return this.fileTree$;
  }

  getProjectFileTree() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/get_tree/`;
        return this.apiService.get<FileTreeResponse>(url, { context: new HttpContext().set(SkipLoading, true)});
      }),
    );
  }

  setSelectedProject(project: string | null) {
    this.selectedProject$.next(project);
    localStorage.setItem('selected_project', project || '');
  }

  getGitRepoDetails(): Observable<RepoDetails> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/git-repo-details`;
        return this.apiService.get<RepoDetailsResponse>(url).pipe(
          map(response => response.data)
        );
      }),
    );
  }

  pullChangesFromGitRemote() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/sync_files/`;
        return this.apiService.post(url);
      }),
    );
  }
}
