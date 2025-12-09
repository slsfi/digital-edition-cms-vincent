import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap, from, concatMap,
         toArray, catchError, of, take } from 'rxjs';

import { SkipLoading } from '../interceptors/loading.interceptor';
import { FacsimileCollectionCreateRequest, FacsimileCollectionEditRequest,
         FacsimileCollectionResponse, FacsimileCollectionsResponse,
         VerifyFacsimileFileResponse, FacsimileCreationConfig,
         FacsimileCreationResult, FacsimileCreationSummary } from '../models/facsimile.model';
import { Publication, Manuscript } from '../models/publication.model';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { PublicationService } from './publication.service';

@Injectable({
  providedIn: 'root'
})
export class FacsimileService {
  selectedProject$: BehaviorSubject<string | null>;

  constructor(
    private apiService: ApiService,
    private projectService: ProjectService,
    private publicationService: PublicationService
  ) {
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  private validateProject(projectName: string | null | undefined): string | never {
    if (!projectName) {
      throw new Error('Project name is required');
    }
    return projectName;
  }

  getFacsimileCollections(projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/list/`;
    return this.apiService.get<FacsimileCollectionsResponse>(url).pipe(
      map(response => response.data)
    );
  }

  getFacsimileCollection(collectionId: number, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${collectionId}/data/`;
    return this.apiService.get<FacsimileCollectionResponse>(url).pipe(
      map(response => response.data)
    );
  }

  addFacsimileCollection(data: FacsimileCollectionCreateRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/new/`;
    return this.apiService.post<FacsimileCollectionResponse>(url, data);
  }

  editFacsimileCollection(collectionId: number, data: FacsimileCollectionEditRequest, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimile_collection/${collectionId}/edit/`;
    return this.apiService.post<FacsimileCollectionResponse>(url, data);
  }

  verifyFacsimileFile(collectionId: number, fileNr: number | string, projectName: string | null | undefined, zoomLevel: 1|2|3|4 = 1) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/verify-facsimile-file/${collectionId}/${fileNr}/${zoomLevel}`;
    return this.apiService.get<VerifyFacsimileFileResponse>(url, {}, true);
  }

  getFacsimileImagePath(collectionId: number, pageNumber: number, projectName: string | null | undefined, zoomLevel: 1|2|3|4 = 1) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/get-single-facsimile-file/${collectionId}/${pageNumber}/${zoomLevel}`
    return url;
  }

  uploadFacsimileFile(collectionId: number, pageNumber: number, formData: FormData, projectName: string | null | undefined) {
    const project = this.validateProject(projectName);
    const url = `${this.apiService.prefixedUrl}/${project}/facsimiles/${collectionId}/${pageNumber}`;
    return this.apiService.post(url, formData, { reportProgress: true, observe: 'events', context: new HttpContext().set(SkipLoading, true) });
  }

  // Legacy method for reactive updates on home page
  getFacsimileCollectionsForCurrentProject() {
    return this.selectedProject$.pipe(
      filter(project => !!project),
      switchMap(project => this.getFacsimileCollections(project))
    );
  }

  /**
   * Creates facsimile collections from publications in a collection
   * Processes publications sequentially as per requirements
   */
  createFacsimilesFromPublications(
    config: FacsimileCreationConfig, 
    projectName: string | null | undefined
  ) {
    const project = this.validateProject(projectName);
    
    return this.publicationService.getPublications(String(config.publicationCollectionId), project).pipe(
      take(1),
      switchMap((publications: Publication[]) => {
        return from(publications).pipe(
          // Sequential processing (one at a time)
          concatMap((publication: Publication, index: number) => {
            return this.processSinglePublication(publication, config, project, index + 1, publications.length);
          }),
          // Collect all results
          toArray(),
          // Final processing
          map((results: FacsimileCreationResult[]) => {
            return {
              total: publications.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
              results: results
            } as FacsimileCreationSummary;
          })
        );
      })
    );
  }

  /**
   * Processes a single publication to create a facsimile collection
   */
  private processSinglePublication(
    publication: Publication, 
    config: FacsimileCreationConfig, 
    project: string,
    currentIndex: number,
    totalCount: number
  ) {
    // Step 1: Get manuscripts if needed for title
    const titleSource$ = config.titleSource === 'manuscript' 
      ? this.publicationService.getManuscriptsForPublication(String(publication.id), project).pipe(
          take(1),
          map((manuscripts: Manuscript[]) => manuscripts.length > 0 ? manuscripts[0].name : (publication.name || `Publication ${publication.id}`))
        )
      : of(publication.name || `Publication ${publication.id}`);

    return titleSource$.pipe(
      switchMap((title: string) => {
        // Step 2: Create facsimile collection
        const facsimileData: FacsimileCollectionCreateRequest = {
          title: title,
          description: config.description,
          folder_path: "",
          external_url: "",
          number_of_pages: config.numberOfPages,
          start_page_number: config.startPageNumber
        };

        return this.addFacsimileCollection(facsimileData, project).pipe(
          take(1),
          switchMap((facsimileResponse: FacsimileCollectionResponse) => {
            // Step 3: Link facsimile to publication
            const linkData = {
              publication_id: publication.id,
              page_nr: 1,
              section_id: 0,
              priority: 1,
              type: 0
            };

            return this.publicationService.linkFacsimileToPublication(
              facsimileResponse.data.id, 
              linkData, 
              project
            ).pipe(
              take(1),
              map(() => ({
                success: true,
                publicationId: publication.id,
                publicationName: publication.name || `Publication ${publication.id}`,
                facsimileId: facsimileResponse.data.id,
                facsimileTitle: title,
                index: currentIndex,
                total: totalCount
              } as FacsimileCreationResult))
            );
          })
        );
      }),
      catchError((error) => {
        console.error(`Failed to process publication ${publication.id}:`, error);
        return of({
          success: false,
          publicationId: publication.id,
          publicationName: publication.name || `Publication ${publication.id}`,
          error: error.message || 'Unknown error',
          index: currentIndex,
          total: totalCount
        } as FacsimileCreationResult);
      })
    );
  }
}
