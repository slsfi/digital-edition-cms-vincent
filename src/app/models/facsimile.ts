import { ApiResponse, Deleted } from "./common";

export interface FacsimileCollectionsResponse extends ApiResponse {
  data: FacsimileCollection[];
}

export interface FacsimileCollectionResponse extends ApiResponse {
  data: FacsimileCollection;
}

export interface PublicationFacsimileResponse extends ApiResponse {
  data: PublicationFacsimile[];
}

export interface PublicationFacsimile {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  description: string | null;
  external_url: string | null;
  id: number;
  page_nr: number;
  priority: number;
  publication_facsimile_collection_id: number;
  publication_id: number;
  publication_manuscript_id: number | null;
  publication_version_id: number | null;
  section_id: number;
  title: string;
  type: number;
}

export interface FacsimileCollection {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  description: string | null;
  external_url: string;
  folder_path: string | null;
  id: number;
  number_of_pages: number | null;
  page_comment: string | null;
  start_page_number: number | null;
  title: string;
}

export interface FacsimileCollectionCreateRequest {
  title: string;
  description: string;
  folderPath: string;
  externalUrl: string;
  numberOfPages: number;
  startPageNumber: number;
}

export interface FacsimileCollectionEditRequest {
  title: string;
  number_of_pages: number | null;
  start_page_number: number | null;
  description: string | null;
  external_url: string;
  deleted: Deleted;
}

export interface EditPublicationFacsimileRequest {
  id: number;
  page_nr?: number;
  section_id?: number;
  priority?: number;
  type?: number;
  deleted?: number;
}

export interface LinkPublicationToFacsimileRequest {
  publication_id: number;
  page_nr: number;
  section_id: number;
  priority: number;
  type: number;
}

export interface VerifyFacsimileFileResponse extends ApiResponse {
  data?: {
    missing_file_numbers: number[];
  };
}

export interface FacsimileForPublication {
  date_created: string;
  date_modified: string | null;
  deleted: Deleted;
  id: number;
  page_nr: number;
  priority: number;
  publication_facsimile_collection_id: number;
  publication_id: number;
  publication_manuscript_id: number | null;
  publication_version_id: number | null;
  section_id: number;
  type: number;
}

export interface LinkFacsimileToPublicationResponse extends ApiResponse {
  data: FacsimileForPublication;
}
