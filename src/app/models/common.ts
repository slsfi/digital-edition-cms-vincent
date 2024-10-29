export interface Column {
  field: string;
  header: string;
  type: string;
  filterable?: boolean;
  filterType?: 'equals' | 'contains';
  editable?: boolean;
  required?: boolean;
  editOrder?: number;
  translations?: boolean;
}

export type QueryParamType = {
  [key: string]: string;
}

export enum Published {
  NotPublished = 0,
  PublishedInternally = 1,
  PublishedExternally = 2,
}

export enum Deleted {
  NotDeleted = 0,
  Deleted = 1,
}

export interface ApiResponse {
  success: boolean;
  message: string;
}
