export interface Person {
  alias: string | null;
  date_born: string | null;
  date_created: string;
  date_deceased: string | null;
  date_modified: string | null;
  deleted: number;
  description: string;
  first_name: string | null;
  full_name: string | null;
  id: number;
  last_name: string | null;
  legacy_id: string;
  occupation: string | null;
  place_of_birth: string | null;
  preposition: string | null;
  previous_last_name: string | null;
  project_id: number;
  source: string | null;
  translation_id: string | null;
  type: string;
}
