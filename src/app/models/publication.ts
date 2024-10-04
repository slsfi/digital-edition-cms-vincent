export interface Publication {
  collection_intro_filename: string | null;
  collection_intro_published: number;
  collection_title_filename: string;
  collection_title_published: number;
  date_created: string;
  date_modified: string | null;
  date_published_externally: string | null;
  id: number;
  legacy_id: string;
  name: string;
  project_id: number;
  publication_collection_introduction_id: number;
  publication_collection_title_id: number;
  published: number;
  title: string;
}
