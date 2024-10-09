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
  type: PersonType;
  sortColumn: string;
}

export interface PersonPayload {
  type: PersonType;
  description: string;
  first_name: string | null;
  last_name: string | null;
  preposition: string | null;
  full_name: string | null;
  legacy_id: string;
  date_born: string | null;
  date_deceased: string | null;
}

enum PersonType {
  AUTHOR = 'Author',
  BRÖDERNA = 'bröderna',
  MYTOLOGISKA_PERSONER = 'mytologiska personer',
  HISTORISKA_PERSONER = 'historiska personer',
  FAMILJ = 'familj',
  FIKTIVA_PERSONER = 'fiktiva personer',
  PERSON = 'person',
  PLAYMAN = 'playman'
}

export const personTypeOptions = [
  { label: 'Author', value: PersonType.AUTHOR },
  { label: 'Bröderna', value: PersonType.BRÖDERNA },
  { label: 'Mytologiska personer', value: PersonType.MYTOLOGISKA_PERSONER },
  { label: 'Historiska personer', value: PersonType.HISTORISKA_PERSONER },
  { label: 'Familj', value: PersonType.FAMILJ },
  { label: 'Fiktiva personer', value: PersonType.FIKTIVA_PERSONER },
  { label: 'Person', value: PersonType.PERSON },
  { label: 'Playman', value: PersonType.PLAYMAN }
];
