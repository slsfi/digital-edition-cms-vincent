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
