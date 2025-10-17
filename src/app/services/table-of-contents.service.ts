import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { TocRoot, TocNode, TocRootApi, TocNodeApi, TocNodeType, TocUpdateRequest, TocResponse, PublicationSortOption, PUBLICATION_SORT_OPTIONS } from '../models/table-of-contents';
import { Publication } from '../models/publication';

@Injectable({
  providedIn: 'root'
})
export class TableOfContentsService {
  private currentToc: TocRoot | null = null;
  private _hasUnsavedChanges = false;

  constructor(
    private apiService: ApiService,
    private projectService: ProjectService
  ) {}

  /**
   * Load table of contents for a collection
   */
  loadToc(collectionId: number): Observable<TocRoot> {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      return throwError(() => new Error('No project selected'));
    }

    const url = `${this.apiService.prefixedUrl}/${projectName}/collection-toc/${collectionId}`;
    
    return this.apiService.get<TocResponse>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          const normalized = this.normalizeTocRoot(response.data);
          this.currentToc = normalized;
          this._hasUnsavedChanges = false;
          return normalized;
        } else {
          throw new Error(response.message || 'Failed to load table of contents');
        }
      }),
      catchError(error => {
        console.error('Error loading table of contents:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Save table of contents for a collection
   */
  saveToc(collectionId: number, toc: TocRoot): Observable<boolean> {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      return throwError(() => new Error('No project selected'));
    }

    const url = `${this.apiService.prefixedUrl}/${projectName}/collection-toc/${collectionId}`;
    
    return this.apiService.put<TocResponse>(url, toc).pipe(
      map(response => {
        if (response.success) {
          this.currentToc = toc;
          this._hasUnsavedChanges = false;
          return true;
        } else {
          throw new Error(response.message || 'Failed to save table of contents');
        }
      }),
      catchError(error => {
        console.error('Error saving table of contents:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update table of contents with fresh publication data from database
   */
  updateTocWithPublicationData(collectionId: number, updateFields: string[]): Observable<TocRoot> {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      return throwError(() => new Error('No project selected'));
    }

    const url = `${this.apiService.prefixedUrl}/${projectName}/collection-toc-update-items/${collectionId}`;
    const request: TocUpdateRequest = { update: updateFields };
    
    return this.apiService.post<TocResponse>(url, request).pipe(
      map(response => {
        if (response.success && response.data) {
          const normalized = this.normalizeTocRoot(response.data);
          this.currentToc = normalized;
          this._hasUnsavedChanges = true; // Mark as unsaved since we updated the data
          return normalized;
        } else {
          throw new Error(response.message || 'Failed to update table of contents');
        }
      }),
      catchError(error => {
        console.error('Error updating table of contents with publication data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate a flat table of contents from publications
   */
  generateFlatToc(collectionId: number, publications: Publication[], sortBy: string, collectionTitle?: string): TocRoot {
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
      date: publication.original_publication_date || undefined,
      description: undefined,
      category: undefined,
      facsimileOnly: false
    }));

    return {
      text: collectionTitle || 'Table of Contents',
      collectionId: collectionId.toString(),
      type: 'title',
      children
    };
  }

  /**
   * Get current table of contents
   */
  getCurrentToc(): TocRoot | null {
    return this.currentToc;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this._hasUnsavedChanges;
  }

  /**
   * Mark that changes have been made
   */
  markAsChanged(): void {
    this._hasUnsavedChanges = true;
  }

  /**
   * Get available sort options
   */
  getSortOptions(): PublicationSortOption[] {
    return PUBLICATION_SORT_OPTIONS;
  }

  /**
   * Normalizes a ToC node from the backend to a new shape to handle
   * legacy ToC data. Specifically, it modifies the value of the `type`
   * property of the node:
   * - `type` is set to "section" if the incoming node has a non-empty
   *   `children` property;
   * - if the incoming `type` already is "section" but the `children`
   *   property is missing or empty, it is set to an empty array;
   * - in other cases, the `type` is inferred as "text"; text nodes
   *   can't have children.
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

    const { type: _ignored, children: _ignoredChildren, ...rest } = node;

    return {
      ...rest,
      type,
      ...(normalizedChildren
        ? { children: normalizedChildren }
        : type === 'section'
          ? { children: [] }
          : {})
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
