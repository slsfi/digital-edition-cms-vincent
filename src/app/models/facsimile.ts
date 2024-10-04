export interface Facsimile {
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
