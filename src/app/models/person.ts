import { Deleted } from "./publication";

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
  translation_id: number | null;
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
export interface Translation {
  field_name: string;
  language: Langugage;
  table_name: string;
  text: string;
  translation_id: number;
  translation_text_id: number;
}

export interface TranslationRequest {
  table_name: string; // name of the table containing the record to be translated
  field_name: string; // name of the field to be translated (if applicable)
  text: string; // the translated text.
  language: Langugage; // the language code for the translation (ISO 639-1).
  translation_id?: number; // the id of an existing translation record in the `translation` table. Required if you intend to add a translation in a new language to an entry that already has one or more translations.
  parent_id?: number; // the id of the record in the table_name table
  parent_translation_field?: string; // the name of the field holding the translation_id (defaults to 'translation_id')
  neutral_text?: string; // the base text before translation
}

export interface TranslationRequestPost {
  table_name: string; // name of the table containing the record to be translated
  field_name?: string; // name of the field to be translated (if applicable)
  language?: Langugage; // the language code for the translation (ISO 639-1).
  translation_text_id?: number; // the id of the record in the `translation_text` table
  deleted?: Deleted;
}

export enum Langugage {
  FINNISH = 'fi',
  SWEDISH = 'sv',
  ENGLISH = 'en',
  ARABIAN = 'ar'
}

export const languageOptions = [
  { label: 'Finnish', value: Langugage.FINNISH },
  { label: 'Swedish', value: Langugage.SWEDISH },
  { label: 'English', value: Langugage.ENGLISH },
  { label: 'Arabian', value: Langugage.ARABIAN }
]

export const nameForLanguage = {
  [Langugage.FINNISH]: 'Finnish',
  [Langugage.SWEDISH]: 'Swedish',
  [Langugage.ENGLISH]: 'English',
  [Langugage.ARABIAN]: 'Arabian'
}
