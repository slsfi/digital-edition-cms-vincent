export interface TocNode {
  type: 'title' | 'subtitle' | 'est';
  text: string;
  collectionId?: string;
  itemId?: string;
  description?: string;
  date?: string;
  category?: string;
  facsimileOnly?: boolean;
  collapsed?: boolean;
  children?: TocNode[];
}

export interface TocRoot {
  text: string;
  collectionId: string;
  type: 'title';
  children: TocNode[];
}

export interface TocUpdateRequest {
  update: string[];
}

export interface TocResponse {
  success: boolean;
  message: string;
  data: TocRoot | null;
}

export interface PublicationSortOption {
  value: string;
  label: string;
}

export const PUBLICATION_SORT_OPTIONS: PublicationSortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'original_filename', label: 'Original Filename' },
  { value: 'original_publication_date', label: 'Publication Date' }
];
