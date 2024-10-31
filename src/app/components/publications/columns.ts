import { Column } from "../../models/common";

export const publicationColumnsData: Column[] = [
  { field: 'id', header: 'ID', type: 'id', editable: false, filterable: true },
  { field: 'name', header: 'Name', type: 'string', editable: true, filterable: true },
  { field: 'published', header: 'Published', type: 'published', editable: true, filterable: true },
  { field: 'actions', header: 'Actions', type: 'action', editable: false },
];
export const allPublicationColumnsData: Column[] = [
  ...publicationColumnsData,
  { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
  { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
  { field: 'genre', header: 'Genre', type: 'string', editable: true },
  { field: 'language', header: 'Language', type: 'string', editable: true },
  { field: 'legacy_id', header: 'Legacy ID', type: 'string', editable: true },
  { field: 'original_filename', header: 'Original Filename', type: 'textarea', editable: true },
  { field: 'original_publication_date', header: 'Original Publication Date', type: 'string', editable: true },
  { field: 'publication_collection_id', header: 'Publication Collection ID', type: 'number', editable: false },
  { field: 'publication_comment_id', header: 'Publication Comment ID', type: 'number', editable: false },
  { field: 'published_by', header: 'Published By', type: 'string', editable: true },
];
export const versionColumnsData: Column[] = [
  { field: 'name', 'header': 'Name', 'type': 'string', 'editable': true },
  { field: 'original_filename', 'header': 'Filename', 'type': 'textarea', 'editable': true },
  { field: 'actions', 'header': 'Actions', 'type': 'action', 'editable': false },
]
export const allVersionColumnsData: Column[] = [
  ...versionColumnsData,
  { field: 'published', header: 'Published', type: 'published', editable: true },
  { field: 'sort_order', header: 'Sort Order', type: 'number', editable: true },
  { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
  { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
  { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
  { field: 'section_id', header: 'Section ID', type: 'number', editable: false },
  { field: 'type', header: 'Type', type: 'number', editable: true },
  { field: 'id', header: 'ID', type: 'number', editable: false },
]
export const manuscriptColumnsData: Column[] = [
  { field: 'name', 'header': 'Name', 'type': 'string', 'editable': true },
  { field: 'original_filename', 'header': 'Filename', 'type': 'textarea', 'editable': true },
  { field: 'actions', 'header': 'Actions', 'type': 'action', 'editable': false },
]

export const allManuscriptColumnsData: Column[] = [
  ...manuscriptColumnsData,
  { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
  { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
  { field: 'id', header: 'ID', type: 'number', editable: false },
  { field: 'language', header: 'Language', type: 'string', editable: false },
  { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
  { field: 'published', header: 'Published', type: 'published', editable: true },
  { field: 'section_id', header: 'Section ID', type: 'number', editable: false },
  { field: 'sort_order', header: 'Sort Order', type: 'number', editable: true },
]
export const commentsColumnData: Column[] = [
  { field: 'original_filename', 'header': 'Filename', 'type': 'textarea', 'editable': true },
  { field: 'actions', 'header': 'Actions', 'type': 'action', 'editable': false },
]
export const allCommentsColumnData: Column[] = [
  ...commentsColumnData,
  { field: 'published', header: 'Published', type: 'published', editable: true },
  { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
]
export const facsimileColumnData: Column[] = [
  { field: 'title', header: 'Title', type: 'string', editable: true },
  { field: 'external_url', header: 'External URL', type: 'string', editable: true },
  { field: 'page_nr', header: 'Page Number', type: 'number', editable: true },
  { field: 'section_id', header: 'Section ID', type: 'number', editable: true },
  { field: 'priority', header: 'Priority', type: 'number', editable: true },
  { field: 'actions', header: 'Actions', type: 'action', editable: false },
]
export const allFacsimileColumnData: Column[] = [
  ...facsimileColumnData,
  { field: 'id', header: 'ID', type: 'number', editable: false },
  { field: 'date_created', header: 'Date Created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date Modified', type: 'date', editable: false },
  { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
  { field: 'description', header: 'Description', type: 'string', editable: false },
  { field: 'publication_facsimile_collection_id', header: 'Publication Facsimile Collection ID', type: 'number', editable: false },
  { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
  { field: 'publication_manuscript_id', header: 'Publication Manuscript ID', type: 'number', editable: false },
  { field: 'publication_version_id', header: 'Publication Version ID', type: 'number', editable: false },
  { field: 'type', header: 'Type', type: 'number', editable: false },
]
