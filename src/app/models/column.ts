export interface Column {
  field: string;
  header: string;
  type: string;
  filterable: boolean;
}

export type QueryParamType = {
  [key: string]: string;
}
