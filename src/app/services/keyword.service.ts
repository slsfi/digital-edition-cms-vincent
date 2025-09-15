import { Injectable } from '@angular/core';
import { Observable, map, of, catchError } from 'rxjs';

import { 
  Keyword, 
  KeywordCreationRequest, 
  KeywordUpdateRequest
} from '../models/keyword';
import { ApiService } from './api.service';

// Backend API response interfaces
interface KeywordApiResponse {
  success: boolean;
  message: string;
  data: KeywordApiData[] | null;
}

interface KeywordApiSingleResponse {
  success: boolean;
  message: string;
  data: KeywordApiData | null;
}

interface KeywordApiData {
  id: number;
  date_created: string | null;
  date_modified: string | null;
  deleted: number;
  type: string | null;
  name: string | null;
  description: string | null;
  legacy_id: string | null;
  project_id: number;
  source: string | null;
  name_translation_id: number | null;
}

interface KeywordTypesApiResponse {
  success: boolean;
  message: string;
  data: string[] | null;
}

interface PublicationKeywordApiResponse {
  success: boolean;
  message: string;
  data: PublicationKeywordApiData[] | null;
}

interface PublicationKeywordApiData {
  id: number;
  date_created: string | null;
  date_modified: string | null;
  deleted: number;
  type: string | null;
  name: string | null;
  description: string | null;
  legacy_id: string | null;
  project_id: number;
  source: string | null;
  name_translation_id: number | null;
  event_occurrence_id: number;
  event_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class KeywordService {

  constructor(
    private apiService: ApiService
  ) {}

  /**
   * Get all keywords in a project
   * Uses the backend endpoint: GET /<project>/keywords/list/
   */
  getKeywords(projectName: string): Observable<Keyword[]> {
    const url = `${this.apiService.prefixedUrl}/${projectName}/keywords/list/`;
    
    console.log('Fetching keywords from URL:', url);
    
    return this.apiService.get<KeywordApiResponse>(url).pipe(
      map(response => {
        console.log('Keywords API response:', response);
        if (response.success && response.data) {
          const keywords = response.data.map(this.mapApiKeywordToKeyword);
          console.log('Mapped keywords:', keywords);
          return keywords;
        }
        console.log('No keywords data in response');
        return [];
      }),
      catchError(error => {
        console.error('Error fetching keywords:', error);
        // Fallback to mock data for development
        console.warn('Falling back to mock data due to API error');
        return of(this.getMockKeywords(1)); // Use default project ID for mock data
      })
    );
  }


  /**
   * Create a new keyword in a project
   * Uses the backend endpoint: POST /<project>/keywords/new/
   */
  createKeyword(request: KeywordCreationRequest, projectName: string): Observable<Keyword> {
    const url = `${this.apiService.prefixedUrl}/${projectName}/keywords/new/`;
    
    const apiRequest = {
      name: request.text,
      type: request.category,
      description: null, // Not in our model yet
      source: null, // Not in our model yet
      legacy_id: null // Not in our model yet
    };

    console.log('Creating keyword with URL:', url, 'and data:', apiRequest);
    
    return this.apiService.post<KeywordApiSingleResponse>(url, apiRequest).pipe(
      map(response => {
        console.log('Create keyword API response:', response);
        if (response.success && response.data) {
          const keyword = this.mapApiKeywordToKeyword(response.data);
          console.log('Mapped created keyword:', keyword);
          return keyword;
        }
        throw new Error('Failed to create keyword');
      }),
      catchError(error => {
        console.error('Error creating keyword:', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing keyword
   * Uses the backend endpoint: POST /<project>/keywords/<id>/edit/
   */
  updateKeyword(request: KeywordUpdateRequest, projectName: string): Observable<Keyword> {
    const url = `${this.apiService.prefixedUrl}/${projectName}/keywords/${request.id}/edit/`;
    
    const apiRequest: { name?: string; type?: string | null } = {};
    if (request.text !== undefined) apiRequest.name = request.text;
    if (request.category !== undefined) apiRequest.type = request.category;

    return this.apiService.post<KeywordApiSingleResponse>(url, apiRequest).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapApiKeywordToKeyword(response.data);
        }
        throw new Error('Failed to update keyword');
      }),
      catchError(error => {
        console.error('Error updating keyword:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a keyword
   * Uses the backend endpoint: POST /<project>/keywords/<id>/edit/ with deleted=1
   */
  deleteKeyword(keywordId: number, projectName: string): Observable<boolean> {
    const url = `${this.apiService.prefixedUrl}/${projectName}/keywords/${keywordId}/edit/`;
    
    const apiRequest = { deleted: 1 };

    return this.apiService.post<KeywordApiSingleResponse>(url, apiRequest).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error deleting keyword:', error);
        throw error;
      })
    );
  }

  /**
   * Get keywords linked to a specific publication
   * Uses the backend endpoint: GET /<project>/publication/<publication_id>/keywords/
   * Keywords are stored in the 'tag' table and connected via events
   */
  getKeywordsForPublication(publicationId: number, projectName: string): Observable<Keyword[]> {
    console.log(`Getting keywords for publication ${publicationId} in project ${projectName}`);
    
    // Use the correct endpoint from the backend API
    const url = `${this.apiService.prefixedUrl}/${projectName}/publication/${publicationId}/keywords/`;
    
    console.log('Fetching publication keywords from URL:', url);
    
    return this.apiService.get<PublicationKeywordApiResponse>(url).pipe(
      map(response => {
        console.log('Publication keywords response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          // Map the tag data to Keyword objects
          const keywords: Keyword[] = response.data.map((tag: PublicationKeywordApiData) => ({
            id: tag.id,
            text: tag.name || '', // The keyword text is in the 'name' field
            category: tag.type || null, // The category is in the 'type' field
            projectId: tag.project_id || 0,
            translations: [] // TODO: Handle translations if needed
          }));
          
          console.log('Mapped keywords from tags:', keywords);
          return keywords;
        }
        
        console.log('No keywords found for publication');
        return [];
      }),
      catchError(error => {
        console.error('Error getting publication keywords:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        return of([]);
      })
    );
  }


  /**
   * Connect a keyword to a publication
   * Uses the backend endpoint: POST /{projectName}/events
   * Creates an event connection between the keyword (tag) and publication
   */
  connectKeywordToPublication(keywordId: number, publicationId: number, projectName: string): Observable<boolean> {
    console.log(`Connecting keyword ${keywordId} to publication ${publicationId} in project ${projectName}`);
    
    // Create an event to connect the keyword to the publication
    // According to backend API: exactly one of subject_id, tag_id, location_id, work_manifestation_id, correspondence_id must be provided
    const request = {
      publication_id: publicationId,
      tag_id: keywordId
    };
    
    const url = `${this.apiService.prefixedUrl}/${projectName}/events/new/`;
    console.log('Creating keyword connection event:', request, 'at URL:', url);
    
    return this.apiService.post(url, request).pipe(
      map(response => {
        console.log('Connect keyword response:', response);
        return true;
      }),
      catchError(error => {
        console.error('Error connecting keyword to publication:', error);
        console.error('Connect error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        
        // Check if it's a CORS error
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          console.error('CORS error detected - endpoint may not be properly configured');
        }
        
        return of(false);
      })
    );
  }

  /**
   * Remove a keyword from a publication
   * Uses the backend endpoint: DELETE /{projectName}/events
   * Deletes the event connection between the keyword (tag) and publication
   */
  disconnectKeywordFromPublication(keywordId: number, publicationId: number, projectName: string): Observable<boolean> {
    console.log(`Disconnecting keyword ${keywordId} from publication ${publicationId} in project ${projectName}`);
    
    // Delete the event connection between the keyword and publication
    // Try different endpoint patterns for DELETE
    const url = `${this.apiService.prefixedUrl}/${projectName}/events/delete/?tag_id=${keywordId}&publication_id=${publicationId}`;
    console.log('Deleting keyword connection event:', url);
    
    return this.apiService.delete(url).pipe(
      map(response => {
        console.log('Disconnect keyword response:', response);
        return true;
      }),
      catchError(error => {
        console.error('Error disconnecting keyword from publication:', error);
        console.error('Disconnect error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        
        // Check if it's a CORS error
        if (error.status === 0 || error.statusText === 'Unknown Error') {
          console.error('CORS error detected - endpoint may not be properly configured');
        }
        
        return of(false);
      })
    );
  }

  /**
   * Get unique categories from project keywords using the backend API
   * Uses the backend endpoint: GET /<project>/keywords/types/
   */
  getUniqueCategories(projectName: string): Observable<string[]> {
    const url = `${this.apiService.prefixedUrl}/${projectName}/keywords/types/`;
    
    return this.apiService.get<KeywordTypesApiResponse>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching keyword types:', error);
        // Fallback to extracting from keywords
        return this.getKeywords(projectName).pipe(
          map(keywords => {
            const categories = keywords
              .map(k => k.category)
              .filter((cat): cat is string => cat !== null && cat !== undefined && cat.trim() !== '');
            return [...new Set(categories)].sort();
          })
        );
      })
    );
  }

  /**
   * Search keywords by text (for autocomplete)
   */
  searchKeywords(projectName: string, searchTerm: string): Observable<Keyword[]> {
    return this.getKeywords(projectName).pipe(
      map(keywords => {
        if (!searchTerm || searchTerm.trim() === '') {
          return keywords;
        }
        const term = searchTerm.toLowerCase();
        return keywords.filter(keyword => 
          keyword.text.toLowerCase().includes(term) ||
          (keyword.category && keyword.category.toLowerCase().includes(term))
        );
      })
    );
  }

  /**
   * Map backend API keyword data to our frontend Keyword model
   */
  private mapApiKeywordToKeyword(apiData: KeywordApiData): Keyword {
    return {
      id: apiData.id,
      text: apiData.name || '',
      category: apiData.type,
      projectId: apiData.project_id,
      translations: [] // TODO: Implement translations when backend supports it
    };
  }


  /**
   * Mock data for development fallback
   */
  private getMockKeywords(projectId: number): Keyword[] {
    return [
      {
        id: 1,
        text: 'salt',
        category: 'ingredients',
        projectId: projectId,
        translations: [
          { language: 'sv', text: 'salt' },
          { language: 'fi', text: 'suola' }
        ]
      },
      {
        id: 2,
        text: 'pepper',
        category: 'ingredients',
        projectId: projectId,
        translations: [
          { language: 'sv', text: 'peppar' },
          { language: 'fi', text: 'pippuri' }
        ]
      },
      {
        id: 3,
        text: 'flour',
        category: 'ingredients',
        projectId: projectId,
        translations: [
          { language: 'sv', text: 'mjöl' },
          { language: 'fi', text: 'jauho' }
        ]
      },
      {
        id: 4,
        text: 'cooking',
        category: 'techniques',
        projectId: projectId,
        translations: [
          { language: 'sv', text: 'kokning' },
          { language: 'fi', text: 'kypsennys' }
        ]
      },
      {
        id: 5,
        text: 'baking',
        category: 'techniques',
        projectId: projectId,
        translations: [
          { language: 'sv', text: 'bakning' },
          { language: 'fi', text: 'leivonta' }
        ]
      },
      {
        id: 6,
        text: 'historical',
        category: null, // Example of keyword without category
        projectId: projectId,
        translations: [
          { language: 'sv', text: 'historisk' },
          { language: 'fi', text: 'historiallinen' }
        ]
      }
    ];
  }
} 
