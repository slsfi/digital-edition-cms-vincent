import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ProjectService } from './project.service';
import { PublicationService } from './publication.service';
import { TocRoot, TocNode, TocUpdateRequest, TocResponse, PublicationSortOption, PUBLICATION_SORT_OPTIONS } from '../models/table-of-contents';
import { Publication } from '../models/publication';

@Injectable({
  providedIn: 'root'
})
export class TableOfContentsService {
  private currentToc: TocRoot | null = null;
  private _hasUnsavedChanges = false;

  constructor(
    private apiService: ApiService,
    private projectService: ProjectService,
    private publicationService: PublicationService
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
          this.currentToc = response.data;
          this._hasUnsavedChanges = false;
          return response.data;
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
          this.currentToc = response.data;
          this._hasUnsavedChanges = true; // Mark as unsaved since we updated the data
          return response.data;
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
  generateFlatToc(collectionId: number, publications: Publication[], sortBy: string): TocRoot {
    // Sort publications based on the selected criteria
    const sortedPublications = [...publications].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return a.id - b.id;
        case 'title':
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
      type: 'est',
      text: publication.name || 'Untitled',
      itemId: `${collectionId}_${publication.id}`,
      date: publication.original_publication_date || undefined,
      description: undefined,
      category: undefined,
      facsimileOnly: false
    }));

    return {
      text: 'Table of Contents',
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
   * Clear current table of contents
   */
  clearCurrentToc(): void {
    this.currentToc = null;
    this._hasUnsavedChanges = false;
  }

  /**
   * Get available sort options
   */
  getSortOptions(): PublicationSortOption[] {
    return PUBLICATION_SORT_OPTIONS;
  }

  /**
   * Create a new subtitle node
   */
  createSubtitleNode(text: string, collapsed: boolean = false): TocNode {
    return {
      type: 'subtitle',
      text,
      collapsed,
      children: []
    };
  }

  /**
   * Create a new text node
   */
  createTextNode(text: string, itemId?: string, date?: string, description?: string, category?: string, facsimileOnly: boolean = false): TocNode {
    return {
      type: 'est',
      text,
      itemId,
      date,
      description,
      category,
      facsimileOnly
    };
  }

  /**
   * Add a node to the table of contents
   */
  addNode(parentPath: number[], node: TocNode): void {
    if (!this.currentToc) {
      return;
    }

    let current = this.currentToc;
    for (let i = 0; i < parentPath.length; i++) {
      const index = parentPath[i];
      if (current.children && current.children[index]) {
        current = current.children[index] as any; // Type assertion for navigation
      } else {
        return; // Invalid path
      }
    }

    if (!current.children) {
      current.children = [];
    }
    current.children.push(node);
    this.markAsChanged();
  }

  /**
   * Remove a node from the table of contents
   */
  removeNode(nodePath: number[]): void {
    if (!this.currentToc || nodePath.length === 0) {
      return;
    }

    if (nodePath.length === 1) {
      // Removing from root level
      this.currentToc.children.splice(nodePath[0], 1);
    } else {
      // Removing from nested level
      let current = this.currentToc;
      for (let i = 0; i < nodePath.length - 1; i++) {
        const index = nodePath[i];
        if (current.children && current.children[index]) {
          current = current.children[index] as any; // Type assertion for navigation
        } else {
          return; // Invalid path
        }
      }

      const lastIndex = nodePath[nodePath.length - 1];
      if (current.children) {
        current.children.splice(lastIndex, 1);
      }
    }

    this.markAsChanged();
  }

  /**
   * Move a node to a new position
   */
  moveNode(fromPath: number[], toPath: number[], toIndex: number): void {
    if (!this.currentToc) {
      return;
    }

    // Get the node to move
    const nodeToMove = this.getNodeByPath(fromPath);
    if (!nodeToMove) {
      return;
    }

    // Remove from original position
    this.removeNode(fromPath);

    // Add to new position
    if (toPath.length === 0) {
      // Moving to root level
      this.currentToc.children.splice(toIndex, 0, nodeToMove);
    } else {
      // Moving to nested level
      let current = this.currentToc;
      for (let i = 0; i < toPath.length; i++) {
        const index = toPath[i];
        if (current.children && current.children[index]) {
          current = current.children[index] as any; // Type assertion for navigation
        } else {
          return; // Invalid path
        }
      }

      if (!current.children) {
        current.children = [];
      }
      current.children.splice(toIndex, 0, nodeToMove);
    }

    this.markAsChanged();
  }

  /**
   * Get a node by its path
   */
  private getNodeByPath(path: number[]): TocNode | null {
    if (!this.currentToc || path.length === 0) {
      return null;
    }

    let current: TocNode | TocRoot = this.currentToc;
    for (const index of path) {
      if (current.children && current.children[index]) {
        current = current.children[index];
      } else {
        return null;
      }
    }

    return current as TocNode;
  }
}
