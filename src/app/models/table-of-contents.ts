import { PublicationLite } from "./publication";

export type TocNodeType = 'section' | 'text';

export type TocSectionNode = TocNode & { type: 'section'; children: TocNode[] };

export type TocContainer = Pick<TocRoot, 'children'> | TocSectionNode;

export interface TocRoot {
  text: string;
  collectionId: string;
  type: 'title';
  children: TocNode[];
  id?: string; // Generated for drag/drop functionality
  isExpanded?: boolean; // UI state for expansion
}

export interface TocNode {
  type: TocNodeType;
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

export interface TocRootApi extends Omit<TocRoot, 'children'> {
  children: TocNodeApi[];
}

// In the ToC API response, we allow any string value for `type`
// on the node object, and then normalize the values to TocNodeType
export interface TocNodeApi
  extends Omit<TocNode, 'type' | 'children'> {
  type?: string;
  children?: TocNodeApi[];
}

export interface TocResponse {
  success: boolean;
  message: string;
  data: TocRootApi | null;
}

export interface TocUpdateRequest {
  update: string[];
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
  { value: 'name', label: 'Name' },
  { value: 'original_filename', label: 'File path' },
  { value: 'original_publication_date', label: 'Date of origin' }
];
