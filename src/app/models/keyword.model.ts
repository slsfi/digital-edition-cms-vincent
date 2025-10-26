export interface Keyword {
  id: number;
  text: string;
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
  text: string;
  category?: string | null;
  projectId: number;
  translations?: KeywordTranslation[];
}

export interface KeywordUpdateRequest {
  id: number;
  text?: string;
  category?: string | null;
  translations?: KeywordTranslation[];
}

export interface KeywordResponse {
  data: Keyword;
  success: boolean;
  message?: string;
}

export interface KeywordsResponse {
  data: Keyword[];
  success: boolean;
  message?: string;
}

