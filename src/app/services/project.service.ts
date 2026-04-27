import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable, take } from 'rxjs';

import { SkipLoading } from '../interceptors/loading.interceptor';
import { AddProjectData, EditProjectData, FileTree, FileTreeResponse,
         Project, ProjectResponse, ProjectsResponse, RepoDetails,
         RepoDetailsResponse, SyncFilesResponse } from '../models/project.model';
import { ApiService } from './api.service';

const SELECTED_PROJECT_STORAGE_KEY = 'selected_project';

/**
 * Persisted representation of the last selected project.
 *
 * The backend environment is part of the value because project names are only
 * meaningful within the environment they came from. This avoids restoring a
 * project from production after the user logs in to staging, or vice versa.
 */
interface StoredProjectSelection {
  environment: string;
  project: string;
}

/**
 * Controls whether a selected-project change should also update localStorage.
 */
interface SetSelectedProjectOptions {
  persist?: boolean;
}

/**
 * Handles project API calls and the current project selection state.
 *
 * The active project is held in memory for reactive UI updates. The last
 * selected project is also persisted together with the selected backend
 * environment, so a forced re-authentication can restore the project before
 * redirecting the user back to a project-dependent route.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiService = inject(ApiService);

  selectedProject$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  fileTree$: BehaviorSubject<FileTree | null> = new BehaviorSubject<FileTree | null>(null);

  constructor() {
    // Initial app loads can reuse the persisted project only if the persisted
    // environment still matches the currently configured environment.
    const storedProject = this.getStoredProjectForEnvironment(this.apiService.environment);
    if (storedProject) {
      this.selectedProject$.next(storedProject);
    }
  }

  getProjects() {
    if (!this.apiService.environment) {
      return new Observable<Project[]>();
    }
    const url = `${this.apiService.prefixedUrl}/projects/list/`;
    return this.apiService.get<ProjectsResponse>(url).pipe(
      map(response => {
        return response.data;
      })
    );
  }

  addProject(payload: AddProjectData) {
    const url = `${this.apiService.prefixedUrl}/projects/new/`;
    return this.apiService.post<ProjectResponse>(url, payload);
  }

  editProject(id: number, payload: EditProjectData) {
    const url = `${this.apiService.prefixedUrl}/projects/${id}/edit/`;
    return this.apiService.post<ProjectResponse>(url, payload);
  }

  getFileTree(): Observable<FileTree | null> {
    if (!this.fileTree$.value) {
      const currentProject = this.getCurrentProject();
      this.getProjectFileTree(currentProject).pipe(take(1)).subscribe(fileTreeResponse => {
        this.fileTree$.next(fileTreeResponse.data);
      });
    }
    return this.fileTree$;
  }

  getProjectFileTree(projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/get_tree/`;
    return this.apiService.get<FileTreeResponse>(url, { context: new HttpContext().set(SkipLoading, true)});
  }

  /**
   * Updates the active project and, by default, persists it for later sessions.
   *
   * Use `persist: false` when only the in-memory authenticated state should be
   * cleared, such as after token expiry. In that case the stored
   * environment/project pair remains available for restoration after login.
   */
  setSelectedProject(project: string | null, options: SetSelectedProjectOptions = {}) {
    this.selectedProject$.next(project);

    if (options.persist ?? true) {
      if (project) {
        this.storeSelectedProject(project);
      } else {
        this.clearStoredSelectedProject();
      }
    }

    // Clear the cached file tree whenever the user picks a new project
    this.fileTree$.next(null);
  }

  /**
   * Restores the persisted project for the provided environment when allowed.
   *
   * `availableProjects` should come from the authenticated login response. This
   * prevents restoring a project that was renamed, deleted, or no longer
   * granted to the current user. The method updates the active project state and
   * returns the restored project name, or null when no safe restore is possible.
   */
  restoreSelectedProjectForEnvironment(environment: string | null | undefined, availableProjects: readonly string[]): string | null {
    const storedSelection = this.readStoredProjectSelection();
    const normalizedEnvironment = this.normalizeEnvironment(environment);

    if (
      !storedSelection ||
      !normalizedEnvironment ||
      storedSelection.environment !== normalizedEnvironment ||
      !availableProjects.includes(storedSelection.project)
    ) {
      this.setSelectedProject(null, { persist: false });
      return null;
    }

    this.setSelectedProject(storedSelection.project);
    return storedSelection.project;
  }

  getCurrentProject(): string | null {
    return this.selectedProject$.value;
  }

  /**
   * Reads the stored project only when it belongs to the given environment.
   */
  private getStoredProjectForEnvironment(environment: string | null | undefined): string | null {
    const storedSelection = this.readStoredProjectSelection();
    const normalizedEnvironment = this.normalizeEnvironment(environment);

    if (!storedSelection || storedSelection.environment !== normalizedEnvironment) {
      return null;
    }

    return storedSelection.project;
  }

  /**
   * Persists the selected project together with the current environment.
   */
  private storeSelectedProject(project: string): void {
    const environment = this.normalizeEnvironment(this.apiService.environment);
    if (!environment) {
      return;
    }

    this.writeStoredProjectSelection({ environment, project });
  }

  /**
   * Reads the selected-project storage value.
   *
   * Legacy installations stored only a plain project name. If such a value is
   * found, it is migrated to the environment-scoped format using the currently
   * configured environment.
   */
  private readStoredProjectSelection(): StoredProjectSelection | null {
    const value = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    if (!value) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(value) as unknown;
      if (this.isStoredProjectSelection(parsedValue)) {
        return {
          environment: this.normalizeEnvironment(parsedValue.environment) ?? parsedValue.environment,
          project: parsedValue.project
        };
      }
    } catch {
      return this.migrateLegacyStoredProject(value);
    }

    return null;
  }

  /**
   * Converts the old plain-string storage format to the current structured
   * environment/project pair.
   */
  private migrateLegacyStoredProject(project: string): StoredProjectSelection | null {
    const environment = this.normalizeEnvironment(this.apiService.environment);
    if (!environment || !project) {
      return null;
    }

    const storedSelection = { environment, project };
    this.writeStoredProjectSelection(storedSelection);
    return storedSelection;
  }

  private writeStoredProjectSelection(selection: StoredProjectSelection): void {
    localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify(selection));
  }

  private clearStoredSelectedProject(): void {
    localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
  }

  private isStoredProjectSelection(value: unknown): value is StoredProjectSelection {
    const selection = value as Partial<StoredProjectSelection> | null;
    return (
      !!selection &&
      typeof selection.environment === 'string' &&
      !!selection.environment &&
      typeof selection.project === 'string' &&
      !!selection.project
    );
  }

  private normalizeEnvironment(environment: string | null | undefined): string | null {
    const trimmedEnvironment = environment?.trim();
    if (!trimmedEnvironment) {
      return null;
    }

    return trimmedEnvironment.endsWith('/') ? trimmedEnvironment : `${trimmedEnvironment}/`;
  }

  private validateProject(projectName: string | null | undefined): string | never {
    if (!projectName) {
      throw new Error('Project name is required');
    }
    return projectName;
  }

  getGitRepoDetails(projectName: string | null | undefined): Observable<RepoDetails> {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/git-repo-details`;
    return this.apiService.get<RepoDetailsResponse>(url).pipe(
      map(response => response.data)
    );
  }

  pullChangesFromGitRemote(projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/sync_files/`;
    return this.apiService.post<SyncFilesResponse>(url);
  }
}
