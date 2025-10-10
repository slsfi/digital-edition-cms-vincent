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
  parentTranslationField?: string;
  visible?: boolean;
  tooltip?: string;
}

export type QueryParamType = Record<string, string>;

export enum Published {
  NotPublished = 0,
  PublishedInternally = 1,
  PublishedExternally = 2,
}

export const PublishedOptions = [
  { label: 'Not published', value: Published.NotPublished },
  { label: 'Internally', value: Published.PublishedInternally },
  { label: 'Production', value: Published.PublishedExternally },
]

export enum Deleted {
  NotDeleted = 0,
  Deleted = 1,
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Home', route: '/', icon: 'home' },
  { label: 'Projects', route: '/projects', icon: 'hub' },
  { label: 'Text collections', route: '/publication-collections', icon: 'library_books' },
  { label: 'Facsimile collections', route: '/facsimiles', icon: 'photo_library' },
  { label: 'Keywords', route: '/keywords', icon: 'label' },
  { label: 'Keyword linking', route: '/keywords/linking', icon: 'link' },
  { label: 'Index of persons', route: '/persons', icon: 'groups' },
  { label: 'Table of Contents', route: '/table-of-contents', icon: 'list_alt' },
]
