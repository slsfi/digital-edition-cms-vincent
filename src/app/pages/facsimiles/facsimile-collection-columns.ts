import { Column } from '../../models/common.model';

export const FACSIMILE_COLLECTION_COLUMNS_DATA: Column[] = [
  { field: 'id', header: 'ID', type: 'id', editable: false, filterable: true },
  { field: 'title', header: 'Title', filterable: true, type: 'string', editable: true, filterType: 'contains' },
  { field: 'description', header: 'Description', filterable: true, type: 'string', editable: true, filterType: 'contains' },
  { field: 'number_of_pages', header: 'Number of pages', filterable: false, type: 'number', editable: true },
  { field: 'start_page_number', header: 'Start page number', filterable: false, type: 'number', editable: true },
  { field: 'external_url', header: 'External URL', filterable: true, type: 'string', filterType: 'contains', editable: true },
  { field: 'actions', header: 'Actions', filterable: false, type: 'action' },
];

export const FACSIMILE_COLLECTION_ALL_COLUMN_DATA: Column[] = [
  ...FACSIMILE_COLLECTION_COLUMNS_DATA,
  { field: 'page_comment', header: 'Page comment', filterable: false, type: 'string', editable: false },
  { field: 'deleted', header: 'Deleted', filterable: false, type: 'boolean', editable: false },
  { field: 'folder_path', header: 'Folder path', filterable: false, type: 'string', editable: false },
];
