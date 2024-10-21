export interface FacsimileCollection {
  date_created: string;
  date_modified: string | null;
  deleted: number;
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
  number_of_pages: number;
  start_page_number: number;
  description: string;
  folder_path: string;
  page_comment: string;
  external_url: string;
}
