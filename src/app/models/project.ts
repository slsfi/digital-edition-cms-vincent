import { ApiResponse } from "./common";

export interface ProjectResponse extends ApiResponse {
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

export interface RepoDetails {
  branch: string;
  name: string;
}

export interface RepoDetailsResponse extends ApiResponse {
  data: RepoDetails;
}

// Dynamic file tree structure,
// example: {
//     "Det_forsta_angfartyget.xml": null,
//     "Maamme_var.xml": null,
//     "Maamme_var_16.xml": null,
//     "Variantkodade": {
//         "Maamme_kirja_var.xml": null,
//         "Maamme_kirja_var_1899.xml": null
//     }
// }
export interface FileTree {
  [key: string]: FileTree | null;
}

export interface FileTreeResponse extends ApiResponse {
  data: FileTree;
}
