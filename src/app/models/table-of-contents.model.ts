import { ApiResponse, LabelledOption, LabelledSelectOption } from "./common.model";
import { PublicationLite } from "./publication.model";
import { GenericLanguageObj } from "./language.model";

export type TocNodeType = 'section' | 'text';

export type TocSectionNode = TocNode & { type: 'section'; children: TocNode[] };

export type TocContainer = Pick<TocRoot, 'children'> | TocSectionNode;

export interface TocRoot {
  text: string;
  collectionId: string;
  type: 'title';
  children: TocNode[];
  coverPageName?: string;
  titlePageName?: string;
  forewordPageName?: string;
  introductionPageName?: string;
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
  language?: string;
  collapsed?: boolean;
  children?: TocNode[];
  id?: string; // Generated for drag/drop functionality
  isExpanded?: boolean; // UI state for expansion
  path?: number[]; // Precomputed node path
}

// Keys in TocNode that are editable in the edit node dialog
export const EDITABLE_TOC_NODE_KEYS = [
  'category',
  'collapsed',
  'date',
  'description',
  'facsimileOnly',
  'itemId',
  'language',
  'text',
  'type',
] as const satisfies ReadonlyArray<keyof TocNode>;

export type EditableTocNodeKey = typeof EDITABLE_TOC_NODE_KEYS[number];
export type EditableTocNode = Pick<TocNode, EditableTocNodeKey>;
export const EDITABLE_TOC_NODE_KEYS_SET = new Set<string>(EDITABLE_TOC_NODE_KEYS as ReadonlyArray<string>);

export interface TocRootApi extends Omit<TocRoot, 'children'> {
  children: TocNodeApi[];
}

// In the ToC API response, we allow any string value for `type`
// on the node object, and then normalize the values to TocNodeType
export interface TocNodeApi
  extends Omit<TocNode, 'type' | 'children' | 'url'> {
  type?: string;
  url?: string; // Legacy property which is ignored if present
  children?: TocNodeApi[];
}

export interface TocResponseApi extends ApiResponse {
  data: TocRootApi;
}

export interface TocResponse extends ApiResponse {
  data: TocRoot;
}

export interface SaveTocResponse extends ApiResponse {
  data: null;
}

export interface TocUpdateRequest {
  update: string[];
}

export interface DropInfo {
  targetId: string;
  action: 'before' | 'after' | 'inside';
}

export interface EditNodeDialogData {
  collectionId: number;
  dialogMode: 'add' | 'edit';
  node?: TocNode;
  publications: PublicationLite[];
}

export const PUBLICATION_SORT_OPTIONS: LabelledOption[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'name' },
  { key: 'original_filename', label: 'file path' },
  { key: 'original_publication_date', label: 'date of origin' }
];

export const UPDATE_TOC_FIELDS: LabelledSelectOption[] = [
  { key: 'text', label: 'Text (from publication name)',
    defaultSelected: true },
  { key: 'date', label: 'Date (from publication date of origin)',
    defaultSelected: false },
  { key: 'language', label: 'Language (from publication language)',
    defaultSelected: false }
];

export const GENERATE_TOC_FIELDS: LabelledSelectOption[] = [
  { key: 'date', label: 'Date (from publication date of origin)',
    defaultSelected: false },
  { key: 'dateDescription', label: 'Description as date in d.m.YYYY format (from publication date of origin)',
    defaultSelected: false },
  { key: 'language', label: 'Language (from publication language)',
    defaultSelected: false },
  { key: 'category', label: 'Category (from publication genre)',
    defaultSelected: false },
  { key: 'facsimileOnly', label: 'Facsimile only set to true',
    defaultSelected: false }
];

export interface TocLanguageVariants {
  hasUniversal: boolean;
  languages: string[];
}

export const UNIVERSAL_TOC_LANGUAGE: GenericLanguageObj = {
  label: 'Universal (all UI languages)',
  code: null
} as const;
