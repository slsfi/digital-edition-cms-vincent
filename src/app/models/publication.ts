import { ApiResponse, Deleted, LabelledSelectOption, Published } from "./common";

export interface PublicationCollectionsResponse extends ApiResponse {
  data: PublicationCollection[];
}

export interface PublicationCollectionResponse extends ApiResponse {
  data: PublicationCollection;
}

export interface PublicationCollection {
  collection_intro_filename: string | null;
  collection_intro_published: number;
  collection_title_filename: string;
  collection_title_published: number;
  date_created: string;
  date_modified: string | null;
  id: number;
  name: string;
  name_translation_id: string | null;
  project_id: number;
  published: Published;
  title: string;
}

export interface PublicationCollectionAddRequest {
  name: string;
  published: Published;
}

export interface PublicationCollectionEditRequest {
  name?: string;
  pubished?: Published;
  deleted?: Deleted;
  cascade_deleted?: boolean;
  cascase_published?: boolean;

}

export interface PublicationsResponse extends ApiResponse {
  data: Publication[];
}

export interface PublicationResponse extends ApiResponse {
  data: Publication;
}

export interface Publication {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  genre: string | null;
  id: number;
  language: string | null;
  name: string | null;
  original_filename: string | null;
  original_publication_date: string | null;
  publication_collection_id: number;
  publication_comment_id: number | null;
  published: Published;
}

export interface PublicationLite {
  // Slimmed down version of Publication with only a few
  // essential fields
  id: number;
  name: string;
  original_publication_date: string | null;
  language: string | null;

  /** Precomputed index for fast filtering */
  _search: string;
}

export const toPublicationLite = (p: Publication): PublicationLite => ({
  id: p.id,
  name: (p.name)?.trim() || '',
  original_publication_date: (p.original_publication_date)?.trim() || null,
  language: (p.language)?.trim() || null,
  _search: `${p.name ?? ''} ${p.id}`.toLowerCase()
});

export interface PublicationAddRequest {
  name?: string | null;
  publication_comment_id?: number;
  published?: Published;
  legacy_id?: string;
  original_filename?: string;
  genre?: string;
  original_publication_date?: string;
  language?: string;
}

export interface PublicationEditRequest {
  publication_collection_id?: number;
  publication_comment_id?: number | null;
  name?: string | null;
  original_filename?: string | null;
  original_publication_date?: string | null;
  published?: Published;
  language?: string | null;
  genre?: string | null;
  deleted?: Deleted;
  cascade_deleted?: boolean;
  cascase_published?: boolean;
}

export interface ReadingText {
  id: number;
  content: string;
  language: string;
}

export interface PublicationCommentsResponse extends ApiResponse {
  data: PublicationComment[];
}

export interface PublicationCommentResponse extends ApiResponse {
  data: PublicationComment;
}
export interface PublicationComment {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  id: number;
  original_filename: string;
  published: Published;
}

export interface PublicationCommentRequest {
  original_filename?: string | null;
  published?: Published;
  deleted?: Deleted;
}

export interface VersionsResponse extends ApiResponse {
  data: Version[];
}

export interface VersionResponse extends ApiResponse {
  data: Version;
}

export interface Version {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  id: number;
  name: string;
  original_filename: string | null;
  publication_id: number;
  published: Published;
  section_id: number | null;
  sort_order: number;
  type: number;
}

export interface VersionEditRequest {
  publication_id?: number;
  deleted?: Deleted;
  published?: Published;
  original_filename?: string | null;
  name?: string | null;
  type?: number | null;
  section_id?: number | null;
  sort_order?: number | null;
}

export interface ManuscriptsResponse extends ApiResponse {
  data: Manuscript[];
}

export interface ManuscriptResponse extends ApiResponse {
  data: Manuscript;
}

export interface Manuscript {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  id: number;
  language: string | null;
  name: string;
  original_filename: string;
  publication_id: number;
  published: Published;
  section_id: number | null;
  sort_order: number;
}

export interface ManuscriptEditRequest {
  publication_id?: number;
  deleted?: Deleted;
  published?: Published;
  original_filename?: string | null;
  name?: string | null;
  section_id?: number | null;
  sort_order?: number | null;
  language?: string | null;
}
export interface ManuscriptRequest {
  name?: string;
  original_filename: string;
  published?: Published;
  sort_order?: number;
}

export interface XmlMetadata {
  genre: string | null;
  language: string | null;
  name: string | null;
  original_publication_date: string | null;
}

export interface XmlMetadataResponse extends ApiResponse {
  data: XmlMetadata;
}


export interface LinkTextToPublicationRequest {
  text_type: 'comment' | 'manuscript' | 'version';
  original_filename: string;
  name?: string | null;
  published?: Published;
  published_by?: string | null;
  legacy_id?: number | null;
  type?: number | null;
  section_id?: number | null;
  sort_order?: number | null;
  language?: string | null;
}

export interface LinkTextToPublicationResponse extends ApiResponse {
  data: LinkTextToPublication;
}

export interface LinkTextToPublication {
  date_created: string;
  date_modified: string | null;
  date_published_externally: string | null;
  deleted: Deleted;
  id: number;
  legacy_id: number | null;
  name: string;
  original_filename: string;
  publication_id: number;
  published: Published;
  published_by: string | null;
  section_id: number;
  sort_order: number;
  type: number;
}

export const METADATA_FIELDS: LabelledSelectOption[] = [
  { key: 'name', label: 'Publication name', defaultSelected: true },
  { key: 'original_publication_date', label: 'Date of origin', defaultSelected: true },
  { key: 'language', label: 'Language', defaultSelected: true },
  { key: 'genre', label: 'Genre', defaultSelected: true }
];
