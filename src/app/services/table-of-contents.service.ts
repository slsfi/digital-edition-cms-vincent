import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';

import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { FileTree, FileTreeResponse } from '../models/project.model';
import { SaveTocResponse, TocNode, TocNodeApi, TocNodeType, TocResponse,
         TocResponseApi, TocRoot, TocRootApi, TocUpdateRequest } from '../models/table-of-contents.model';
import { Publication } from '../models/publication.model';
import { getReadableDate } from '../utils/utility-functions';


@Injectable({
  providedIn: 'root'
})
export class TableOfContentsService {
  private readonly apiService = inject(ApiService);
  private readonly projectService = inject(ProjectService);

  getTocFilesList(): Observable<FileTree> {
    const projectName = this.projectService.getCurrentProject();
    const url = `${this.apiService.prefixedUrl}/${projectName}/get_tree/toc`;
    return this.apiService.get<FileTreeResponse>(url, {}, true).pipe(
      map((response: FileTreeResponse) => response.data)
    );
  }

  /**
   * Load table of contents for a collection.
   */
  loadToc(collectionId: number, language?: string | null): Observable<TocRoot> {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      return throwError(() => new Error('No project selected.'));
    }

    const langSeg = language ? `/${language}` : '';
    const url = `${this.apiService.prefixedUrl}/${projectName}/collection-toc/${collectionId}${langSeg}`;
    
    return this.apiService.get<TocResponseApi>(url, {}, true).pipe(
      map((response: TocResponseApi) => {
        const normalized = this.normalizeTocRoot(response.data);
        return normalized;
      })
    );
  }

  /**
   * Save table of contents for a collection.
   */
  saveToc(collectionId: number, toc: TocRoot, language?: string | null): Observable<SaveTocResponse> {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      return throwError(() => new Error('No project selected.'));
    }

    const langSeg = language ? `/${language}` : '';
    const url = `${this.apiService.prefixedUrl}/${projectName}/collection-toc/${collectionId}${langSeg}`;
    
    return this.apiService.put<SaveTocResponse>(url, toc);
  }

  /**
   * Update table of contents with fresh publication data from database.
   */
  updateTocWithPublicationData(
    collectionId: number,
    updateFields: string[]
  ): Observable<TocResponse> {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      return throwError(() => new Error('No project selected.'));
    }

    const url = `${this.apiService.prefixedUrl}/${projectName}/collection-toc-update-items/${collectionId}`;
    const request: TocUpdateRequest = { update: updateFields };
    
    return this.apiService.post<TocResponseApi>(url, request).pipe(
      map((response: TocResponseApi) => {
        const normalizedTocRoot: TocRoot = this.normalizeTocRoot(response.data);
        const normalizedResp: TocResponse = {
          success: response.success,
          data: normalizedTocRoot,
          message: response.message
        }
        return normalizedResp;
      })
    );
  }

  /**
   * Creates a new TocRoot object from the given parameters.
   */
  createNewTocRoot(
    collectionId: number,
    collectionTitle: string = 'Table of contents',
    children: TocNode[] = []
  ): TocRoot {
    return {
      text: collectionTitle,
      collectionId: String(collectionId),
      type: 'title',
      children
    };
  }

  /**
   * Generate a flat table of contents from publications.
   */
  generateFlatToc(
    collectionId: number,
    publications: Publication[],
    sortBy: string,
    collectionTitle?: string,
    includedFields?: string[]
  ): TocRoot {
    // Sort publications based on the selected criteria
    const sortedPublications = [...publications].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return a.id - b.id;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'original_filename':
          return (a.original_filename || '').localeCompare(b.original_filename || '');
        case 'original_publication_date':
          return (a.original_publication_date || '').localeCompare(b.original_publication_date || '');
        default:
          return 0;
      }
    });

    // Create text nodes for each publication
    const children: TocNode[] = sortedPublications.map(publication => ({
      type: 'text',
      text: publication.name || 'Untitled',
      itemId: `${collectionId}_${publication.id}`,
      ...(includedFields?.includes('date') && publication.original_publication_date
        ? { date: publication.original_publication_date }
        : {}
      ),
      ...(includedFields?.includes('dateDescription') &&
            publication.original_publication_date &&
            getReadableDate(publication.original_publication_date)
        ? { description: getReadableDate(publication.original_publication_date) }
        : {}
      ),
      ...(includedFields?.includes('language') && publication.language
        ? { language: publication.language }
        : {}
      ),
      ...(includedFields?.includes('category') && publication.genre
        ? { category: publication.genre }
        : {}
      ),
      ...(includedFields?.includes('facsimileOnly')
        ? { facsimileOnly: true }
        : {}
      )
    }));

    return this.createNewTocRoot(collectionId, collectionTitle, children);
  }

  /**
   * Normalizes a ToC node from the backend to a new shape to handle
   * legacy ToC data.
   * 
   * The `type` property is modified accordingly:
   * - `type` is set to "section" if the incoming node has a non-empty
   *   `children` property;
   * - if the incoming `type` already is "section" but the `children`
   *   property is missing or empty, it is set to an empty array;
   * - in other cases, the `type` is inferred as "text"; text nodes
   *   can't have children.
   * 
   * The `collapsed` property is modified accordingly:
   * - `collapsed` is set to "true" on section nodes that are missing
   *   the property (collapsed is true by default)
   */
  private normalizeTocNode(node: TocNodeApi): TocNode {
    const incomingChildren = Array.isArray(node.children)
      ? node.children
      : [];
    const hasValidChildren = incomingChildren.length > 0;

    // Normalize children only if non-empty; text nodes must not have children.
    const normalizedChildren = hasValidChildren
      ? incomingChildren.map(child => this.normalizeTocNode(child))
      : undefined;

    const type: TocNodeType = (hasValidChildren || node.type === 'section')
      ? 'section'
      : 'text';

    // default value for 'collapsed' is true if undefined
    const collapsed: boolean = node.collapsed === false
      ? false
      : true;

    const {
      type: _ignoredType,
      collapsed: _ignoredCollapsed,
      children: _ignoredChildren,
      url: _ignoredUrl, // Legacy property which is ignored
      ...rest
    } = node;

    return {
      ...rest,
      type,
      ...(type === 'section' // add 'collapsed' only if section node
        ? { collapsed }
        : {}
      ),
      ...(normalizedChildren // add normalized children if defined ...
        ? { children: normalizedChildren }
        : type === 'section' // or empty 'children' if section node ...
          ? { children: [] }
          : {}) // otherwise don't add 'children' property
    };
  }

  private normalizeTocRoot(root: TocRootApi): TocRoot {
    return {
      ...root,
      type: 'title',
      children: (root.children ?? []).map(n => this.normalizeTocNode(n))
    };
  }

}
