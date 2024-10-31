import { ApiResponse, Deleted, Published } from "./common";
import { Langugage } from "./translation";

export interface PublicationCollectionResponse extends ApiResponse {
  data: PublicationCollection[];
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

export interface PublicationResponse extends ApiResponse {
  data: Publication[];
}

export interface Publication {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  genre: string | null;
  id: number;
  language: string | null;
  name: string;
  original_filename: string | null;
  original_publication_date: string | null;
  publication_collection_id: number;
  publication_comment_id: number | null;
  published: Published;
}
export interface PublicationAddRequest {
  name: string;
  publication_comment_id?: number;
  published?: Published;
  legacy_id?: string;
  original_filename?: string;
  genre?: string;
  original_publication_date?: string;
  language?: Langugage;
}

export interface PublicationEditRequest {
  publication_collection_id?: number;
  publication_comment_id?: number;
  name?: string;
  original_filename?: string;
  original_publication_date?: string;
  published?: Published;
  language?: Langugage;
  genre?: string;
  deleted?: Deleted;
  cascade_deleted?: boolean;
  cascase_published?: boolean;
}

export interface ReadingText {
  id: number;
  content: string;
  language: string;
}

export interface PublicationCommentResponse extends ApiResponse {
  data: PublicationComment[];
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
  original_filename?: string;
  published?: Published;
  deleted?: Deleted;
}

export interface VersionResponse extends ApiResponse {
  data: Version[];
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
  original_filename?: string;
  name?: string
  type?: number;
  section_id?: number;
  sort_order?: number;
}

export interface ManuscriptResponse extends ApiResponse {
  data: Manuscript[];
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
  original_filename?: string;
  name?: string;
  section_id?: number;
  sort_order?: number;
  language?: Langugage;
}
export interface ManuscriptRequest {
  name?: string;
  original_filename: string;
  published?: Published;
  sort_order?: number;
}

export interface ManuscriptResponse {
  id: string;
  manuscripts: Manuscript[];
}



export interface LinkTextToPublicationRequest {
  text_type: 'comment' | 'manuscript' | 'version';
  original_filename: string;
  name?: string;
  published?: Published;
  published_by?: string;
  legacy_id?: number;
  type?: number;
  section_id?: number;
  sort_order?: number;
  language?: string;
}
