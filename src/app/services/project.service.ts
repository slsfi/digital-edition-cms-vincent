import { LinkTextToPublicationRequest, ManuscriptResponse, Publication, PublicationCollectionResponse, PublicationCommentResponse, PublicationResponse, VersionResponse } from './../models/publication';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { Person, PersonPayload, PersonResponse, TranslationRequest, TranslationRequestPost } from '../models/person';
import { Manuscript, ManuscriptRequest, PublicationCollection, PublicationCollectionRequest, PublicationComment, PublicationCommentRequest, PublicationRequest, ReadingText, Version, VersionRequest } from '../models/publication';
import { EditPublicationFacsimileRequest, FacsimileCollection, FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest, FacsimileCollectionResponse, LinkPublicationToFacsimileRequest, PublicationFacsimile, PublicationFacsimileResponse } from '../models/facsimile';
import { AddProjectData, EditProjectData, Project, ProjectResponse } from '../models/project';

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





  getPublicationCollections(): Observable<PublicationCollection[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/list/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationCollectionResponse) => response.data)
        );
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

  getPublication(publicationId: number): Observable<Publication> {
    // /<project>/publication/<publication_id>
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}`;
        return this.apiService.get(url).pipe(
          map((response: Publication[]) => response[0])
        );
      }
    ));
  }

  getPublications(collectionId: string): Observable<Publication[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication_collection/${collectionId}/publications/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationResponse) => response.data)
        );
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

  linkTextToPublication(publicationId: number, payload: LinkTextToPublicationRequest) {
    // /<project>/publication/<publication_id>/link_text/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/link_text/`;
        return this.apiService.post(url, payload);
      }),
      catchError(() => of())
    );
  }

  getCommentsForPublication(collectionId: string, publicationId: string): Observable<PublicationComment[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comments/`;
        return this.apiService.get(url).pipe(
          map((response: PublicationCommentResponse) => response.data)
        )
      }),
      catchError(() => of([]))
    );
  }

  editComment(publicationId: number, data: PublicationCommentRequest) {
    // /<project>/publication/<publication_id>/comment/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/comment/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  getVersionsForPublication(publicationId: string): Observable<Version[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/versions/`;
        return this.apiService.get(url).pipe(
          map((response: VersionResponse) => response.data)
        );
      }),
      catchError(() => of([]))
    );
  }

  editVersion(versionId: number, data: VersionRequest) {
    // /<project>/versions/<version_id>/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/versions/${versionId}/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  addVersion(publicationId: number, data: VersionRequest) {
    // /<project>/publication/<publication_id>/versions/new/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/versions/new/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  getManuscriptsForPublication(publicationId: string): Observable<Manuscript[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/manuscripts/`;
        return this.apiService.get(url).pipe(
          map((response: ManuscriptResponse) => response.data)
        );
      }),
      catchError(() => of([] as Manuscript[]))
    );
  }

  editManuscript(manuscriptId: number, data: ManuscriptRequest) {
    // /<project>/manuscripts/<manuscript_id>/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/manuscripts/${manuscriptId}/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  addManuscript(publicationId: number, data: ManuscriptRequest) {
    // /<project>/publication/<publication_id>/manuscripts/new/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/manuscripts/new/`;
        return this.apiService.post(url, data);
      }
    ));
  }

  getFacsimilesForPublication(publicationId: string): Observable<PublicationFacsimile[]> {
    // /<project>/publication/<publication_id>/facsimiles/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/publication/${publicationId}/facsimiles/`;
        return this.apiService.get(url).pipe(map((response: PublicationFacsimileResponse) => response.data));
      }),
      catchError(() => of([]))
    );
  }

  editFacsimileForPublication(data: EditPublicationFacsimileRequest) {
    // /<project>/facsimile_collection/facsimile/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/facsimile/edit/`;
        return this.apiService.post(url, data);
      }),
      catchError(() => of())
    );
  }

  linkFacsimileToPublication(facsimileCollectionId: number, data: LinkPublicationToFacsimileRequest) {
    // /<project>/facsimile_collection/<collection_id>/link/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${facsimileCollectionId}/link/`;
        return this.apiService.post(url, data);
      })
    );
  }

  getSubjects(): Observable<Person[]> {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/subjects/list/`;
        return this.apiService.get(url).pipe(
          map((response: PersonResponse) => response.data),
          catchError((err) => {
            return of([] as Person[])
          })
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

  addTranslation(payload: TranslationRequest) {
    // /<project>/translation/new/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translation/new/`;
        return this.apiService.post(url, payload);
      })
    );
  }

  editTranslation(translation_id: number, payload: TranslationRequest) {
    // /<project>/translations/<translation_id>/edit/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/edit/`;
        return this.apiService.post(url, payload);
      })
    );
  }

  getTranslations(translation_id: number, data: TranslationRequestPost): Observable<any> {
    // /<project>/translations/<translation_id>/list/
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => {
        const url = `${this.apiService.prefixedUrl}/${project}/translations/${translation_id}/list/`;
        return this.apiService.post(url, data);
      })
    );
  }

}
