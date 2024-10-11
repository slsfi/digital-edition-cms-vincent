export interface PublicationCollection {
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
  published: Published;
  title: string;
}

export interface Publication {
  date_created: string;
  date_modified: string | null;
  date_published_externally: string | null;
  deleted: number;
  genre: string | null;
  id: number;
  language: string | null;
  legacy_id: string | null;
  name: string;
  original_filename: string | null;
  original_publication_date: string | null;
  publication_collection_id: number;
  publication_comment_id: number | null;
  publication_group_id: number | null;
  published: Published;
  published_by: string | null;
  zts_id: string | null;
}

export interface ReadingText {
  id: number;
  content: string;
  language: string;
}
export interface PublicationComment {
  date_created: string;
  date_modified: string | null;
  date_published_externally: string | null;
  deleted: number;
  id: number;
  legacy_id: string;
  original_filename: string;
  published: Published;
  published_by: string | null;
}

export interface Version {
  date_created: string;
  date_modified: string | null;
  date_published_externally: string | null;
  deleted: number;
  id: number;
  legacy_id: string;
  name: string;
  original_filename: string | null;
  publication_id: number;
  published: Published;
  published_by: string | null;
  section_id: number | null;
  sort_order: number;
  type: number;
}
export interface Manuscript {
  id: number;
  language: string | null;
  legacy_id: string;
  manuscript_changes: string;
  manuscript_normalized: string;
  name: string;
  original_filename: string;
  sort_order: number;
}

export interface ManuscriptResponse {
  id: string;
  manuscripts: Manuscript[];
}

export enum Published {
  NotPublished = 0,
  PublishedInternally = 1,
  PublishedExternally = 2,
}
