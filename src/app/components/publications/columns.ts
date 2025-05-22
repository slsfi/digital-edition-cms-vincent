import { Column } from "../../models/common";

export const publicationColumnsData: Column[] = [
  { field: 'id', header: 'ID', type: 'id', editable: false, filterable: true },
  { field: 'name', header: 'Name', type: 'string', filterType: 'contains', editable: true, filterable: true, editOrder: 3 },
  { field: 'published', header: 'Published', type: 'published', editable: true, filterable: true, editOrder: 4 },
  { field: 'actions', header: 'Actions', type: 'action', editable: false },
];
export const allPublicationColumnsData: Column[] = [
  ...publicationColumnsData,
  {
    field: 'link_manuscript',
    header: 'Also add manuscript.',
    type: 'boolean',
    editable: true,
    editOrder: 2,
    tooltip: 'Toggle this to also link a manuscript to the publication using the same XML-file. Apply only when the same XML-file should be used for both the reading-text and manuscript view.'
  },
  {
    field: 'cascade_published',
    header: 'Also apply selected published status to any comments, manuscripts or variants linked to the publication.',
    type: 'boolean',
    editable: true,
    editOrder: 5
  },
  { field: 'date_created', header: 'Date created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date modified', type: 'date', editable: false },
  { field: 'genre', header: 'Genre', type: 'string', editable: true, editOrder: 8 },
  { field: 'language', header: 'Language', type: 'string', editable: true, editOrder: 7 },
  { field: 'original_filename', header: 'Reading text file path', type: 'textarea', editable: true, editOrder: 1 },
  { field: 'original_publication_date', header: 'Date of origin', type: 'string', editable: true, editOrder: 6 },
  { field: 'publication_collection_id', header: 'Publication collection ID', type: 'number', editable: false },
  { field: 'publication_comment_id', header: 'Publication comment ID', type: 'number', editable: false },
];
export const versionColumnsData: Column[] = [
  { field: 'name', header: 'Name', type: 'string', editable: true, editOrder: 2 },
  { field: 'original_filename', header: 'Variant file path', type: 'textarea', editable: true, editOrder: 1 },
  { field: 'type', header: 'Type', type: 'type', editable: true, editOrder: 4 },
  { field: 'sort_order', header: 'Sort order', type: 'number', editable: true, editOrder: 5 },
  { field: 'section_id', header: 'Section ID', type: 'number', editable: true, editOrder: 6 },
  { field: 'actions', header: 'Actions', type: 'action', editable: false },
]
export const allVersionColumnsData: Column[] = [
  ...versionColumnsData,
  { field: 'published', header: 'Published', type: 'published', editable: true, editOrder: 3 },
  { field: 'date_created', header: 'Date created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date modified', type: 'date', editable: false },
  { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
  { field: 'id', header: 'ID', type: 'number', editable: false },
]
export const manuscriptColumnsData: Column[] = [
  { field: 'name', 'header': 'Name', 'type': 'string', 'editable': true, editOrder: 2 },
  { field: 'original_filename', 'header': 'Manuscript file path', 'type': 'textarea', 'editable': true, editOrder: 1 },
  { field: 'language', header: 'Language', type: 'string', editable: true, editOrder: 4 },
  { field: 'sort_order', header: 'Sort order', type: 'number', editable: true, editOrder: 5 },
  { field: 'section_id', header: 'Section ID', type: 'number', editable: true, editOrder: 6 },
  { field: 'actions', 'header': 'Actions', 'type': 'action', 'editable': false },
]

export const allManuscriptColumnsData: Column[] = [
  ...manuscriptColumnsData,
  { field: 'date_created', header: 'Date created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date modified', type: 'date', editable: false },
  { field: 'id', header: 'ID', type: 'number', editable: false },
  { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
  { field: 'published', header: 'Published', type: 'published', editable: true, editOrder: 3 },
]
export const commentsColumnData: Column[] = [
  { field: 'original_filename', header: 'Comment file path', type: 'textarea', editable: true },
  { field: 'actions', header: 'Actions', type: 'action', editable: false },
]
export const allCommentsColumnData: Column[] = [
  ...commentsColumnData,
  { field: 'published', header: 'Published', type: 'published', editable: true },
]
export const facsimileColumnData: Column[] = [
  { field: 'title', header: 'Title', type: 'string', editable: false },
  { field: 'external_url', header: 'External URL', type: 'string', editable: false },
  { field: 'page_nr', header: 'Page number', type: 'number', editable: true },
  { field: 'priority', header: 'Priority', type: 'number', editable: true },
  { field: 'section_id', header: 'Section ID', type: 'number', editable: true },
  { field: 'actions', header: 'Actions', type: 'action', editable: false },
]
export const allFacsimileColumnData: Column[] = [
  ...facsimileColumnData,
  { field: 'id', header: 'ID', type: 'number', editable: false },
  { field: 'date_created', header: 'Date created', type: 'date', editable: false },
  { field: 'date_modified', header: 'Date modified', type: 'date', editable: false },
  { field: 'deleted', header: 'Deleted', type: 'boolean', editable: false },
  { field: 'description', header: 'Description', type: 'string', editable: false },
  { field: 'publication_facsimile_collection_id', header: 'Facsimile collection ID', type: 'number', editable: false },
  { field: 'publication_id', header: 'Publication ID', type: 'number', editable: false },
  { field: 'publication_manuscript_id', header: 'Manuscript ID', type: 'number', editable: false },
  { field: 'publication_version_id', header: 'Variant ID', type: 'number', editable: false },
  { field: 'type', header: 'Type', type: 'number', editable: false },
]
