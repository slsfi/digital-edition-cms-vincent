import { PublicationLite } from "./publication";

export interface TocNode {
  type?: 'title' | 'subtitle' | 'est'; // Optional for backend compatibility
  text: string;
  collectionId?: string;
  itemId?: string;
  description?: string;
  date?: string;
  category?: string;
  facsimileOnly?: boolean;
  collapsed?: boolean;
  children?: TocNode[];
  id?: string; // Generated for drag/drop functionality
  isExpanded?: boolean; // UI state for expansion
}

export interface TocRoot {
  text: string;
  collectionId: string;
  type: 'title';
  children: TocNode[];
  id?: string; // Generated for drag/drop functionality
  isExpanded?: boolean; // UI state for expansion
}

export interface TocUpdateRequest {
  update: string[];
}

export interface TocResponse {
  success: boolean;
  message: string;
  data: TocRoot | null;
}

export interface DropInfo {
  targetId: string;
  action: 'before' | 'after' | 'inside';
}

export interface PublicationSortOption {
  value: string;
  label: string;
}

export interface EditNodeDialogData {
  collectionId: number;
  dialogMode: 'add' | 'edit';
  node?: TocNode;
  publications: PublicationLite[];
}

export const PUBLICATION_SORT_OPTIONS: PublicationSortOption[] = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'original_filename', label: 'Original Filename' },
  { value: 'original_publication_date', label: 'Publication Date' }
];
