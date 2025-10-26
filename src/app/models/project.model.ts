import { ApiResponse } from "./common.model";

export interface ProjectsResponse extends ApiResponse {
  data: Project[];
}

export interface ProjectResponse extends ApiResponse {
  data: Project;
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

export interface RepoDetails {
  branch: string;
  name: string;
}

export interface RepoDetailsResponse extends ApiResponse {
  data: RepoDetails;
}

export interface FileTree {
  [key: string]: FileTree | null;
}

export interface FileTreeResponse extends ApiResponse {
  data: FileTree;
}

export interface SyncFilesResponse extends ApiResponse {
  data: {
    changed_files: string[];
  };
}
