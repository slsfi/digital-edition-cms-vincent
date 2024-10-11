export interface Column {
  field: string;
  header: string;
  type: string;
  filterable?: boolean;
  editable?: boolean;
  required?: boolean;
  editOrder?: number;
}

export type QueryParamType = {
  [key: string]: string;
}
