import { ApiResponse } from "./common.model";

export interface Keyword {
  id: number;
  name: string;
  category?: string | null;  // Can be null, string for now
  projectId: number;
  translations?: KeywordTranslation[];
  // Event information for linked keywords (only present when keyword is linked to a publication)
  // These fields are populated when fetching keywords for a specific publication
  eventId?: number;
  eventOccurrenceId?: number;
}

export interface KeywordTranslation {
  language: string;
  text: string;
}

export interface KeywordCreationRequest {
  name: string;
  category?: string | null;
  translations?: KeywordTranslation[];
}

export interface KeywordUpdateRequest {
  id: number;
  name?: string;
  category?: string | null;
  translations?: KeywordTranslation[];
}


export interface KeywordCreationApiRequest {
  name: string;
  type?: string | null;
  description?: string | null;
  source?: string | null;
  legacy_id?: string | null;
}

export interface KeywordResponse extends ApiResponse {
  data: Keyword;
}

export interface KeywordsResponse extends ApiResponse {
  data: Keyword[];
}

// Backend API response interfaces
export interface KeywordApiResponse extends ApiResponse {
  data: KeywordApiData[] | null;
}

export interface KeywordApiSingleResponse extends ApiResponse {
  data: KeywordApiData | null;
}

export interface KeywordApiData {
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

export interface KeywordTypesApiResponse extends ApiResponse {
  data: string[] | null;
}

export interface PublicationKeywordApiResponse extends ApiResponse {
  data: PublicationKeywordApiData[] | null;
}

export interface PublicationKeywordApiData {
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
