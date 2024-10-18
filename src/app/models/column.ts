export interface Column {
  field: string;
  header: string;
  type: string;
  filterable?: boolean;
  editable?: boolean;
  required?: boolean;
  editOrder?: number;
  translations?: boolean;
}

export type QueryParamType = {
  [key: string]: string;
}
