export interface ProjectResponse {
  success: boolean;
  message: string;
  data: Project[];
}

export interface Project {
  date_created: string;
  date_modified: string | null;
  deleted: number;
  id: number;
  name: string;
  published: number;
}

export interface EditProjectData {
  name: string;
  published: number;
}

export interface AddProjectData {
  name: string;
}
