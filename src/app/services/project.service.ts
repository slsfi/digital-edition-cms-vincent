import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { Person, PersonPayload } from '../models/person';
import { ManuscriptResponse, PublicationCollection, PublicationCollectionRequest, PublicationComment, PublicationRequest, ReadingText, Version } from '../models/publication';
import { Facsimile } from '../models/facsimile';
import { AddProjectData, EditProjectData, Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  selectedProject$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);


  constructor(private apiService: ApiService) {
    if (localStorage.getItem('selected_project')) {
      this.selectedProject$.next(localStorage.getItem('selected_project'));
    }
  }

  getProjects(): Observable<Project[]> {
    if (!this.apiService.environment) {
      return new Observable<Project[]>();
    }
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
    this.selectedProject$.next(project);
    localStorage.setItem('selected_project', project || '');
  }

  getFacsimiles(): Observable<Facsimile[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  getPublicationCollections(): Observable<PublicationCollection[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/list/`;
        return this.apiService.get(url);
      }
    ));
  }

  editPublicationCollection(collectionId: number, data: PublicationCollectionRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/edit/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  addPublicationCollection(data: PublicationCollectionRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/new/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  getPublications(collectionId: string) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/`;
        return this.apiService.get(url);
      }
    ));
  }

  editPublication(publicationId: number, data: PublicationRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  addPublication(collectionId: number,data: PublicationRequest) {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/new/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  getReadingTextForPublication(collectionId: string, publicationId: string): Observable<ReadingText> {
    return this.selectedProject$.pipe(
      filter(project => {
        return !!project
      }),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/text/${collectionId}/${publicationId}/est`;
        return this.apiService.get(url);
      }),
      catchError(() => of({} as ReadingText))
    );
  }

  getCommentForPublication(collectionId: string, publicationId: string): Observable<PublicationComment[]> {
    // /<project>/text/<collection_id>/<publication_id>/com
    // /<project>/publication/<publication_id>/comments/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comments/`;
        return this.apiService.get(url);
      }),
      catchError(() => of())
    );
  }

  getVersionsForPublication(collectionId: string, publicationId: string): Observable<Version[]> {
      // /<project>/publication/<publication_id>/versions/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/versions/`;
        return this.apiService.get(url);
      }),
      catchError(() => of([]))
    );
  }

  getManuscriptsForPublication(collectionId: string, publicationId: string): Observable<ManuscriptResponse> {
    // <project>/text/<collection_id>/<publication_id>/ms/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/text/${collectionId}/${publicationId}/ms/`;
        return this.apiService.get(url);
      }),
      catchError(() => of({} as ManuscriptResponse))
    );
  }

  getSubjects(): Observable<Person[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects`;
        return this.apiService.get(url);
      }
    ));
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
